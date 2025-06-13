import { Request, Response } from 'express';
import { Review } from '../models/reviewModel';
import agenda from '../jobs/agendaThread';


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

    const review = new Review({
      userId: userId ,
      text,
      category,
      businessId
    });

    await review.save();
    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
};

// Get all reviews for a specific business
export const getAllReviews = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;
 
    if (!businessId) {
        console.error('Missing businessId from request');
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    const reviews = await Review.find({ businessId : businessId }).populate('userId', 'name email');

    res.status(200).json(reviews);
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

    const review = await Review.findById(reviewId).populate('userId', 'name email');
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

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
};
export const getReviewsByUser = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found in token' });
    }

    const reviews = await Review.find({ userId }).populate('userId', 'name email').populate('businessId', 'BusinessName');;

    if (reviews.length === 0) {
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
  getReviewById,
  deleteReviewById,
  getReviewsByUser,
  triggerWeeklyAnalyze
};
