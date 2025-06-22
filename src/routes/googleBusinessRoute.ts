import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import googleBusinessController from '../controllers/googleBusinessController';

const router = express.Router();
router.use(authenticateJwt);

// Google OAuth connection routes
router.post('/googleOauth', googleBusinessController.connectGoogleBusiness);
router.get('/isGoogleConnected', googleBusinessController.checkGoogleConnection);

// Google Business API utilities
router.get('/getAccessToken', googleBusinessController.getAccessToken);
router.get('/fetchAllGoogleReviews', googleBusinessController.getAllGoogleReviews);
router.get('/fetchNewGoogleReviews', googleBusinessController.getNewGoogleReviews);

export default router;
