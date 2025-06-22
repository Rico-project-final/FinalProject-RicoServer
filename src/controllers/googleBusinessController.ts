import { Request, Response } from 'express';
import { Business } from '../models/BusinessModel';
import axios from 'axios';
import dotenv from 'dotenv';
import { promises } from 'dns';
import { IReview, Review } from '../models/reviewModel';

dotenv.config();

const DOMAIN_URL = process.env.DOMAIN_URL ?? 'http://localhost:5173';

// POST connect Google Business
export const connectGoogleBusiness = async (req: Request & { businessId?: string }, res: Response): Promise<any> => {
  try {
    const { code, placeId } = req.body;
    const { businessId } = req;

    if (!code || !placeId || !businessId) {
      return res.status(400).json({ message: 'Missing code, placeId, or businessId' });
    }

    const redirectUri = `${DOMAIN_URL}/google-business-callback`;

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      null,
      {
        params: {
          code,
          client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
      }
    );

    const {refresh_token } = tokenRes.data;

    if (!refresh_token) {
      return res.status(400).json({ message: 'Missing refresh token from Google. User may have already authorized.' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    business.googlePlaceId = placeId;
    business.googleRefreshToken = refresh_token;
    business.isGoogleConnected = true;

    await business.save();

    return res.status(200).json({ message: 'Business successfully connected to Google' });

  } catch (error: any) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Failed to connect business to Google' });
  }
};
// GET check if Google is connected
export const checkGoogleConnection = async (req: Request & { businessId?: string }, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId' });
    }

    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.status(200).json({
      isGoogleConnected: business.isGoogleConnected || false,
      googlePlaceId: business.googlePlaceId || null,
    });

  } catch (error: any) {
    console.error('Error checking Google connection:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAccessToken = async (businessId: string): Promise<any> => {
  if (!businessId) {
    throw new Error('Missing businessId');
  }

  const business = await Business.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  if (!business.googleRefreshToken) {
    throw new Error('Google refresh token not found for business');
  }

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      null,
      {
        params: {
          client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          refresh_token: business.googleRefreshToken,
          grant_type: 'refresh_token',
        },
      }
    );

    return tokenRes.data;
  } catch (err: any) {
    console.error('Error refreshing token:', err.response?.data || err.message);
    throw new Error('Failed to refresh access token');
  }
};


// GET all reviews from Google (first full sync)
export const getAllGoogleReviews = async (req: Request & { businessId?: string }, res: Response): Promise<any> => {
  try {
    const { businessId } = req;
    if (!businessId) return res.status(400).json({ message: "Missing businessId" });

    const business = await Business.findById(businessId);
    if (!business || !business.googlePlaceId) {
      return res.status(404).json({ message: "Business or placeId not found" });
    }

    const accessToken = await getAccessToken(businessId);
    if (!accessToken) return res.status(500).json({ message: "Failed to get access token" });

    const response = await axios.get(
      `https://mybusiness.googleapis.com/v4/accounts/${process.env.GOOGLE_ACCOUNT_ID}/locations/${business.googlePlaceId}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${accessToken.access_token}`,
        },
      }
    );

    const googleReviews = response.data.reviews || [];

    let added = 0;

    for (const gReview of googleReviews) {
      const googleReviewId = gReview.reviewId;

      // Check if review with this Google ID already exists
      const exists = await Review.findOne({ googleReviewId });
      if (exists) continue;

      const newReview = new Review({
        text: gReview.comment || "",
        userId: null,
        category: null,
        isAnalyzed: false,
        businessId,
        googleReviewId, // TODO :: fix schema to include googleReviewId
      });

      await newReview.save();
      added++;
    }

    return res.status(200).json({ message: `Fetched ${googleReviews.length} reviews. Added ${added} new reviews.` });
  } catch (error: any) {
    console.error("Failed to fetch new Google reviews:", error.response?.data || error.message);
    return res.status(500).json({ message: "Failed to fetch new Google reviews" });
  }
};


// GET only new reviews from Google (since last fetch)
export const getNewGoogleReviews = async (req: Request & { businessId?: string }, res: Response) => {
  // logic here
};


export default {
    checkGoogleConnection,
    connectGoogleBusiness,
    getAccessToken,
    getAllGoogleReviews,
    getNewGoogleReviews
};
