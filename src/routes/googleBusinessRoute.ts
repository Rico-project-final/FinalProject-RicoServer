import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import googleBusinessController from '../controllers/googleBusinessController';

const router = express.Router();

router.get('/google-business-callback', googleBusinessController.googleOAuthCallback);

router.use(authenticateJwt);

// Google OAuth connection routes
router.post('/googleOauth', googleBusinessController.connectGoogleBusiness);
router.get('/isGoogleConnected', googleBusinessController.checkGoogleConnection);

// Google Business API utilities
router.post('/syncGoogleReviews', googleBusinessController.syncGoogleReviews);

export default router;
