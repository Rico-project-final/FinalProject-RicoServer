import { Request, Response } from 'express';
import { ReviewAnalysis } from '../models/reviewAnalysisModel';
import { UserReview } from '../models/userReviewModel';
import { GoogleReview } from '../models/googleReviewModel';


interface AuthenticatedRequest extends Request {
  userId?: string;
  businessId?: string;
}
// Get all reviews (admin-only)
export const getAllReviewsAnalasisNoPage = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId from request' });
    }
    
    const reviews = await ReviewAnalysis.find({ businessId }).populate('userId', 'name email');

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Get all reviews analysis error:', error);
    res.status(500).json({ message: 'Error fetching reviews analysis' });
  }
};
//Another get all with pagination
export const getAllReviewsAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId from request' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      ReviewAnalysis.find({ businessId })
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit),
      ReviewAnalysis.countDocuments({ businessId })
    ]);

    res.status(200).json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all reviews analysis error:', error);
    res.status(500).json({ message: 'Error fetching reviews analysis' });
  }
};


// Get a review by ID 
export const getAnalasisById = async (req: Request, res: Response):Promise<any> => {
    try {
        const { reviewId } = req.params;

        const review = await ReviewAnalysis.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.status(200).json(review);
    } catch (error) {
        console.error('Get review by ID error:', error);
        res.status(500).json({ message: 'Error fetching review' });
    }
};
export const updateReviewAnalysis = async (req: Request, res: Response):Promise<any> => {
    try {
        const { reviewId } = req.params;
        const updatedReview = await ReviewAnalysis.findOneAndUpdate({reviewId : reviewId}, {isResolved:true});
        if (!updatedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.status(200).json(updatedReview);
    } catch (error) {
        console.error('Get review by ID error:', error);
        res.status(500).json({ message: 'Error fetching review' });
    }
}

export const checkReviewAnalysisStatus = async ( req: AuthenticatedRequest, res: Response ): Promise<any> => {
  try {
    const { businessId } = req; // comes from middleware or JWT

    if (!businessId) {
      return res.status(400).json({ message: 'Missing business ID' });
    }

    const userReviewsCount = await UserReview.countDocuments({ businessId });
    const googleReviewsCount = await GoogleReview.countDocuments({ businessId });
    const totalReviews = userReviewsCount + googleReviewsCount;

    const analyzedCount = await ReviewAnalysis.countDocuments({ businessId });

    const allAnalyzed = analyzedCount >= totalReviews;

    return res.status(200).json({ allAnalyzed });
  } catch (error) {
    console.error('Error checking review analysis status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};




export default {
    getAllReviewsAnalysis,
    getAllReviewsAnalasisNoPage,
    getAnalasisById,
    updateReviewAnalysis,
    checkReviewAnalysisStatus
  };
