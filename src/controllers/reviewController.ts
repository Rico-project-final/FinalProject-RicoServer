import { Request, Response } from 'express';
import { Review } from '../models/reviewModel';

// Create a review (guest or authenticated user)
export const createReview = async (req: Request & { userId?: string }, res: Response):Promise<any> => {
    try {
        const { text, category } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Missing required field: text' });
        }
        const review = new Review({
            userId: req.userId || null,
            text,
            category
        });

        await review.save();
        res.status(201).json({ message: 'Review created successfully', review });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: 'Error creating review' });
    }
};

// Get all reviews (admin-only)
export const getAllReviews = async (_req: Request, res: Response):Promise<any> => {
    try {
        const reviews = await Review.find().populate('userId', 'name email');
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

// Get a review by ID (admin-only)
export const getReviewById = async (req: Request, res: Response):Promise<any> => {
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

// Delete a review by ID (admin-only)
export const deleteReviewById = async (req: Request, res: Response):Promise<any> => {
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

export default {
    createReview,
    getAllReviews,
    getReviewById,
    deleteReviewById
};
