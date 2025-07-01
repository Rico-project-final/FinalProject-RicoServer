import { Request, Response } from "express";
import {
  connectGoogleBusinessService,
  checkGoogleConnectionService,
  getAccessToken,
  fetchGoogleReviewsFromAPI,
  processAndSaveReviews,
} from "../utils/googleBusinessUtil";
import { Business } from "../models/BusinessModel";
import { GoogleReview } from "../models/googleReviewModel";
import agenda from '../jobs/agendaThread';
import axios from "axios";

// POST - Connect a business to Google Business using OAuth
export const connectGoogleBusiness = async (req: Request & { businessId?: string }, res: Response) : Promise<any> => {
  try {
    console.log("1 : Connecting business to Google Business...");
    const { code, placeId } = req.body;
    const businessId = req.businessId;

    if (!code || !placeId || !businessId) {
      return res
        .status(400)
        .json({ message: "Missing code, placeId, or businessId" });
    }

    await connectGoogleBusinessService(businessId, code, placeId);
    console.log("5 : Business connected to Google Business successfully");

    return res
      .status(200)
      .json({ message: "Business successfully connected to Google" });
  } catch (error: any) {
    console.error("Google OAuth error:", error.message || error);
    return res.status(500).json({ message: "Failed to connect business to Google" });
  }
};

// GET - Check if a business is connected to Google Business
export const checkGoogleConnection = async (req: Request & { businessId?: string }, res: Response) : Promise<any> => {
  try {
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ message: "Missing businessId" });
    }

    const status = await checkGoogleConnectionService(businessId);

    return res.status(200).json(status);
  } catch (error: any) {
    console.error("Error checking Google connection:", error.message || error);
    return res.status(500).json({ message: "Server error" });
  }
};

//POST - Sync Google reviews for a business and analyze them.
export const syncGoogleReviews = async (req: Request & { businessId?: string }, res: Response) : Promise<any> => {
    try {
    const businessId = req.businessId;

    if (!businessId) return res.status(400).json({ message: "Missing businessId" });

    const business = await Business.findById(businessId);
    if (!business || !business.googlePlaceId) {
      return res.status(404).json({ message: "Business or placeId not found" });
    }

    // Fetch both newest and most relevant reviews
    const newestReviews = await fetchGoogleReviewsFromAPI(business.googlePlaceId, "newest");
    const relevantReviews = await fetchGoogleReviewsFromAPI(business.googlePlaceId, "most_relevant");

    const allReviews = [...newestReviews, ...relevantReviews];

    // Get last saved date for optimization
    const lastSavedReview = await GoogleReview.findOne({ businessId }).sort({ createdAt: -1 }).lean();
    const lastSavedDate = lastSavedReview?.createdAt;

    // Let processAndSaveReviews handle all filtering and saving
    const added = await processAndSaveReviews(allReviews, businessId, lastSavedDate);

    if (added === 0) {
      return res.status(200).json({ message: "No new reviews to add" });
    }

    await agenda.now("weekly review analyze", { businessId });

    business.lastSyncDate = new Date();
    await business.save();

    return res.status(200).json({
      message: `Fetched ${allReviews.length} reviews. Added ${added} new reviews.`,
    });
  } catch (error: any) {
    console.error("Failed to fetch new Google reviews:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch new Google reviews" });
  }
};

export const googleOAuthCallback = async (req: Request, res: Response): Promise<any> => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send("Missing code");
  }
    console.log("Google OAuth callback received code:", code);
  return res.send(`
    <html>
      <body>
        <script>
          window.opener.postMessage({ type: 'google-oauth-code', code: '${code}' }, window.location.origin);
          window.close();
        </script>
        <p>ההתחברות הושלמה. ניתן לסגור את החלון.</p>
      </body>
    </html>
  `);
};

export default {
  syncGoogleReviews,
  checkGoogleConnection,
  connectGoogleBusiness,
  googleOAuthCallback
};

