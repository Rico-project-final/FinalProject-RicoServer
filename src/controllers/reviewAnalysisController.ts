import { Request, Response } from 'express';
import { ReviewAnalysis } from '../models/reviewAnalysisModel';
import mongoose from "mongoose";


// Get all reviews (admin-only)
export const getAllReviewsAnalasis = async (req: Request, res: Response):Promise<any> => {
    try {
        const reviews = await ReviewAnalysis.find()
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

// Get a review by ID (admin-only)
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
