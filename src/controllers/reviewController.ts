import { Request, Response } from 'express';
import { UserReview } from '../models/userReviewModel';
import agenda from '../jobs/agendaThread';
import { GoogleReview } from '../models/googleReviewModel';
import mongoose from 'mongoose';

// Add types for requests with businessId and userId
interface AuthenticatedRequest extends Request {
  userId?: string;
  businessId?: string;
}

// Create a review
export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { text, category, businessId  } = req.body;
    const { userId} = req;

    if (!text) {
      return res.status(400).json({ message: 'Missing required field: text' });
    }

    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    const review = new UserReview({
      userId: userId ,
      text,
      category,
      businessId,
      source: 'user'
    });

    await review.save();
    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
};

// Get all reviews for a specific business
export const getAllReviewsNoPage = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      console.error('Missing businessId from request');
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    // Fetch user reviews and populate user details
    const userReviews = await UserReview.find({ businessId })
      .populate('userId', 'name email')
      .lean();

    // Fetch Google reviews
    const googleReviews = await GoogleReview.find({ businessId }).lean();

    // Add a `source` field to each for clarity
    const userReviewsWithSource = userReviews.map((review) => ({
      ...review,
      source: 'user'
    }));

    const googleReviewsWithSource = googleReviews.map((review) => ({
      ...review,
      source: 'google'
    }));

    // Combine all reviews
    const combinedReviews = [...userReviewsWithSource, ...googleReviewsWithSource];

    // Optionally sort by date if needed
    combinedReviews.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    res.status(200).json(combinedReviews);
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

//Another get all with pagination
export const getAllReviews = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      console.error('Missing businessId from request');
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch all user and Google reviews
    const [userReviews, googleReviews] = await Promise.all([
      UserReview.find({ businessId }).populate('userId', 'name email').lean(),
      GoogleReview.find({ businessId }).lean()
    ]);

    // Tag each review with a source
    const userReviewsWithSource = userReviews.map((review) => ({
      ...review,
      source: 'user'
    }));

    const googleReviewsWithSource = googleReviews.map((review) => ({
      ...review,
      source: 'google'
    }));

    // Combine and sort by createdAt (newest first)
    const combinedReviews = [...userReviewsWithSource, ...googleReviewsWithSource].sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    const total = combinedReviews.length;
    const paginatedReviews = combinedReviews.slice(skip, skip + limit);

    res.status(200).json({
      reviews: paginatedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};


// Trigger weekly analyze
export const triggerWeeklyAnalyze = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      return res.status(400).json({ message: "Missing businessId in request body" });
    }
    console.log("Triggering weekly review analyze for businessId:", businessId);
    await agenda.now("weekly review analyze", { businessId });

    res.status(200).json({ message: `Triggered weekly review analyze for businessId: ${businessId}` });
  } catch (error) {
    console.error("Trigger Agenda jobs error:", error);
    res.status(500).json({ message: "Error triggering Agenda jobs" });
  }
};

// Get a review by ID
export const getReviewById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reviewId } = req.params;

    const review = await UserReview.findById(reviewId).populate('userId', 'name email');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({ message: 'Error fetching review' });
  }
};

// Delete a review by ID
export const deleteReviewById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { reviewId } = req.params;

    const review = await UserReview.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
};
// GET - reviews by user
export const getReviewsByUser = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req;

    const reviews = await UserReview.find({ userId }).populate('userId', 'name email').populate('businessId', 'BusinessName');
    if (!reviews) {
      return res.status(404).json({ message: 'No reviews found for this user' });
    }

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Get reviews by user error:', error);
    res.status(500).json({ message: 'Error fetching reviews by user' });
  }
};

export default {
  createReview,
  getAllReviews,
  getAllReviewsNoPage,
  getReviewById,
  deleteReviewById,
  triggerWeeklyAnalyze,
  getReviewsByUser
};
