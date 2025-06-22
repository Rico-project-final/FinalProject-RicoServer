import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import userController from '../controllers/userController';

const router = express.Router();

// Protected routes (require authentication)
router.use(authenticateJwt);
router.get('/dashboard', userController.getDashboard);
router.get('/getAll', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.get('/', userController.getProfile);
router.post('/update', userController.updateProfile);
router.delete('/delete', userController.deleteProfile);

export default router;
