import express from 'express';
import { authenticateJwt } from '../middleware/auth';
// import { checkAdmin } from '../middleware/checkAdmin';
import businessController from '../controllers/businessController';

const router = express.Router();

router.post('/create', businessController.createBusiness);
router.get('id/:businessId', businessController.getbusinessById);

router.use(authenticateJwt);
router.get('/' , businessController.getAllbusinesses);
router.put('/update/:businessId', businessController.updateBusiness);
router.delete('/delete/:businessId', businessController.deleteBusiness);

router.post('/generateQR', businessController.getQRCodeForBusiness);
router.post('/sendEmailResponse' , businessController.sendResponseToCustomer);
router.get('/lastSyncDate', businessController.getLastSyncDate);



export default router;
