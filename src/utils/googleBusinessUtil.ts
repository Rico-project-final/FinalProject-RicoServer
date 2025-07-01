import axios from "axios";
import { Business } from "../models/BusinessModel";
import { GoogleReview } from "../models/googleReviewModel";
import mongoose from "mongoose";

export const DOMAIN_URL = process.env.DOMAIN_URL ?? "http://localhost:5173";

// Exchange auth code for refresh token & save business connection
export async function connectGoogleBusinessService(
  businessId: string,
  code: string,
  placeId: string
): Promise<void> {
  const redirectUri = `${DOMAIN_URL}/google-business-callback`;

  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    null,
    {
      params: {
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      },
    }
  );
  console.log("2 : Google token response:", tokenRes.data);

  const refresh_token = tokenRes.data.refresh_token;
  if (!refresh_token) {
    throw new Error(
      "Missing refresh token from Google. User may have already authorized."
    );
  }
  console.log("3 : Google refresh token:", refresh_token);

  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error("Business not found");
  }

  business.googlePlaceId = placeId;
  business.googleRefreshToken = refresh_token;
  business.isGoogleConnected = true;
  console.log("4 : before Saving business connection to Google...");
  await business.save();
}

// Check if business is connected
export async function checkGoogleConnectionService(businessId: string) {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error("Business not found");
  }
  return {
    isGoogleConnected: business.isGoogleConnected || false,
    googlePlaceId: business.googlePlaceId || null,
  };
}

// Get fresh access token from refresh token
export async function getAccessToken(businessId: string): Promise<any> {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error("Business not found");
  }
  if (!business.googleRefreshToken) {
    throw new Error("Google refresh token not found for business");
  }

  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    null,
    {
      params: {
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        refresh_token: business.googleRefreshToken,
        grant_type: "refresh_token",
      },
    }
  );

  return tokenRes.data;
}


// Fetch the list of locations associated with the Google account.
 
async function fetchGoogleLocationId(accessToken: string): Promise<string> {
  try {
    console.log("1 : Fetching Google location ID...");
    const response = await axios.get('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("2 : Google accounts response:", response.data);
    const account = response.data.accounts?.[0]?.name; // e.g., 'accounts/123456789'
    if (!account) throw new Error("No account found.");

    const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?readMask=name`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("3 : Google locations response:", locationsRes.data);
    const locationId = locationsRes.data.locations?.[0]?.name; // e.g., 'accounts/123456789/locations/987654321'
    if (!locationId) throw new Error("No location found.");

    return account + locationId;
  } catch (error) {
    if (typeof error === "object" && error !== null && "response" in error && "message" in error) {
      // @ts-ignore
      console.error("Failed to fetch location ID:", (error as any).response?.data || (error as any).message);
    } else {
      console.error("Failed to fetch location ID:", error);
    }
    throw new Error("Failed to retrieve location ID");
  }
} 

// Fetch reviews for a given Google business location.
/*export async function fetchGoogleReviewsFromAPI( accessToken: string ): Promise<any[]> {
  try {
    const requestInfo = await fetchGoogleLocationId(accessToken);
    console.log("4 : Requesting Google reviews for location:", requestInfo);

    const reviewRes = await axios.get(
      `https://mybusiness.googleapis.com/v4/${requestInfo}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const reviews = reviewRes.data.reviews || [];
    return reviews;
  } catch (error: any) {
    console.error("Failed to fetch Google reviews:", error?.response?.data || error.message);
    throw new Error("Failed to retrieve Google reviews");
  } 

} */



// Process and save only new reviews (compared by date)
export async function processAndSaveReviews( googleReviews: any[], businessId: string, lastSavedDate?: Date) {
   let added = 0;

  for (const gReview of googleReviews) {
    // Convert timestamp to JS Date
    const reviewDate = gReview.time ? new Date(gReview.time * 1000) : null;

    // If a last saved date exists and this review is older or equal, skip
    if (lastSavedDate && reviewDate && reviewDate <= lastSavedDate) {
      continue; // or break if reviews are sorted newest to oldest
    }

    // Generate fallback "reviewId" from author_url + time + text snippet
    const authorIdMatch = gReview.author_url?.match(/contrib\/(\d+)/);
    const authorId = authorIdMatch ? authorIdMatch[1] : "unknown";
    const reviewId = `${authorId}_${gReview.time}_${(gReview.text || "").slice(0, 30)}`;

    // Check if this review already exists in DB
    const exists = await GoogleReview.findOne({ reviewId });
    if (exists) continue;

    // Create new review entry
    const newReview = new GoogleReview({
      reviewId,
      text: gReview.text || "",
      authorName: gReview.author_name || "Anonymous",
      isAnalyzed: false,
      createdAt: reviewDate,
      businessId,
      source: "google",
    });
    console.log("5 : Saving new Google review:", newReview);
    await newReview.save();
    added++;
  }

  return added;
}

export const fetchGoogleReviewsFromAPI = async (placeId: string, sort: "newest" | "most_relevant" = "most_relevant"): Promise<any[]> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const params = {
      place_id: placeId,
      fields: "reviews",
      review_sort: sort, 
      key: process.env.GOOGLE_PLACES_API_KEY,
    };

    const response = await axios.get(url, { params });
    console.log(`google response (${sort}):`, response.data);

    if (response.data.status !== "OK") {
      throw new Error(`Places API error: ${response.data.status}`);
    }

    const reviews = response.data.result.reviews || [];
    return reviews;
  } catch (error: any) {
    console.error("Error fetching Google reviews from Places API:", error.message);
    throw error;
  }
};


