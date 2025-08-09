import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
  getInstancesStatus,
  generateQRCode,
  disconnectInstance
} from '../controllers/instanceController.js';

const router = Router();

router.use(authenticateToken);

router.get('/status', getInstancesStatus);
router.get('/:instanceId/qrcode', generateQRCode);
router.post('/:instanceId/disconnect', disconnectInstance);

export default router;