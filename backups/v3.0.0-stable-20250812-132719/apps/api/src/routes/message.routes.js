import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import {
  sendCustomMessage,
  getMessageHistory,
  getMessageStats
} from '../controllers/messageController.js';

const router = Router();

router.use(authenticateToken);

router.post('/send', sendCustomMessage);
router.get('/history', getMessageHistory);
router.get('/stats', getMessageStats);

export default router;