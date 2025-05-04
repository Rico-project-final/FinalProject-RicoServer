import express from 'express';
import authController from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { uploadImage } from '../middleware/uploads';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/googleAuth', authController.googleSignIn);
router.post('/login', authController.login);
export default router;
