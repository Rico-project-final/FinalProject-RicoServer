import express from 'express';
import { authenticateJwt } from '../middleware/auth';
// import { checkAdmin } from '../middleware/checkAdmin';
import businessController from '../controllers/businessController';

const router = express.Router();

router.post('/create', businessController.createBusiness);

router.use(authenticateJwt);
router.get('/' , businessController.getAllbusinesses);
router.get('/:businessId', businessController.getbusinessById);
router.put('/update/:businessId', businessController.updateBusiness);
router.delete('/delete/:businessId', businessController.deleteBusiness);




export default router;
