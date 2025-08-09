import { Router } from 'express';
import webhookRoutes from './webhook.routes.js';
import messageRoutes from './message.routes.js';
import instanceRoutes from './instance.routes.js';
import authRoutes from './auth.routes.js';
import statusRoutes from './status.routes.js';
import broadcastRoutes from '../modules/broadcast/routes/broadcast.routes.js';

const router = Router();

router.use('/webhook', webhookRoutes);
router.use('/messages', messageRoutes);
router.use('/instances', instanceRoutes);
router.use('/auth', authRoutes);
router.use('/status', statusRoutes);
router.use('/broadcast', broadcastRoutes);

router.get('/', (req, res) => {
  res.json({
    name: 'OracleWA - Recuperação Império',
    version: '1.0.0',
    status: 'active'
  });
});

export default router;