import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import taskController from '../controllers/taskController';

const router = express.Router();


router.use(authenticateJwt);
router.get('/' , taskController.getAllTasks);
router.get('/:taskId', taskController.getTaskById);
router.post('/create', taskController.createTask);
router.put('/update/:taskId', taskController.updateTask);
router.delete('/delete/:taskId', taskController.deleteTask);
router.post('/complete/:taskId', taskController.completeTask);




export default router;
