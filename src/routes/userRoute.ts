import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import userController from '../controllers/userController';
// import { uploadImage } from '../middleware/uploads';

const router = express.Router();

router.get('/dashboard', userController.getDashboard);
router.get('/getAll', userController.getAllUsers);
router.get('/:userId', userController.getUserById);

// Protected routes (require authentication)
router.use(authenticateJwt);

router.get('/', userController.getProfile);
router.post('/update', userController.updateProfile);
router.delete('/delete', userController.deleteProfile);

export default router;
