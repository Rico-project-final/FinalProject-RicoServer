import express from 'express';
// import authController from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { uploadImage } from '../middleware/uploads';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/googleAuth', authController.googleSignIn);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.use(authenticateJwt);

router.post('/logout', authController.logout);

export default router;
