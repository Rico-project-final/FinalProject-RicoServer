import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import  reviewAnalysisController from '../controllers/reviewAnalysisController';

const router = express.Router();

// Protected routes (require authentication, and being admin)
router.use(authenticateJwt);
router.get('/getAll', reviewAnalysisController.getAllReviewsAnalysis);
router.get('/:reviewId', reviewAnalysisController.getAnalasisById);
router.post('/update/:reviewId' ,reviewAnalysisController.updateReviewAnalysis );

export default router;
