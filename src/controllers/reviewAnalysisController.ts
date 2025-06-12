import { Request, Response } from 'express';
import { ReviewAnalysis } from '../models/reviewAnalysisModel';


interface AuthenticatedRequest extends Request {
  userId?: string;
  businessId?: string;
}
//TODO ::  add another method using pagination
// Get all reviews (admin-only)
export const getAllReviewsAnalasis = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { businessId } = req;

    if (!businessId) {
      return res.status(400).json({ message: 'Missing businessId from request' });
    }
    
    const reviews = await ReviewAnalysis.find({ businessId });

    res.status(200).json(reviews);
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
export default {
    getAllReviewsAnalasis,
    getAnalasisById,
    updateReviewAnalysis
};
