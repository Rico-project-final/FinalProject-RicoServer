import express from 'express';
import { authenticateJwt } from '../middleware/auth';
// import { checkAdmin } from '../middleware/checkAdmin';
import { optionalAuthenticateJwt } from '../middleware/auth';
import  reviewController from '../controllers/reviewController';

const router = express.Router();

router.post('/create', optionalAuthenticateJwt,  reviewController.createReview);

// Protected routes (require authentication, and being admin)
router.use(authenticateJwt);
// router.use(checkAdmin); 
router.get('/getAll', reviewController.getAllReviews);
router.get('/getByUser', reviewController.getReviewsByUser);
router.get('/:reviewId', reviewController.getReviewById);
router.delete('/delete/:reviewId', reviewController.deleteReviewById);
router.post('/triggerAll', reviewController.triggerWeeklyAnalyze);


export default router;
