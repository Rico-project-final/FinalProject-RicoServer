import express from 'express';
import authController from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { uploadImage } from '../middleware/uploads';

const router = express.Router();

// Public routes
router.post('/registerCustomer', authController.registerUser);
router.post('/registerBusiness', authController.registerBusiness);
router.post('/customerGoogleAuth', authController.customerGoogleSignIn);
router.post('/businessGoogleAuth', authController.businessGoogleSignIn);
router.post('/login', authController.login);
router.get('/verifyEmail' , authController.verifyEmail);
export default router;
