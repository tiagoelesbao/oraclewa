import express from 'express';
import {
  sendMessage,
  sendBroadcast,
  sendTemplate,
  getTemplates,
  getAllTemplates,
  getStatus,
  getProviders,
  getProviderRecommendation,
  calculateCosts,
  handleWebhook
} from '../controllers/broadcastController.js';
import {
  processCsvBroadcast,
  uploadCsvFile,
  generateSampleCsv,
  validateCsv,
  testBroadcast
} from '../controllers/csvBroadcastController.js';
import { validateBroadcastRequest, validateWebhookRequest } from '../middleware/broadcast.middleware.js';

const router = express.Router();

// Send single message with optional buttons
router.post('/send', validateBroadcastRequest, sendMessage);

// Send broadcast to multiple phones
router.post('/campaign', validateBroadcastRequest, sendBroadcast);

// Send template message
router.post('/template', validateBroadcastRequest, sendTemplate);

// List available templates (ZAPI only - legacy)
router.get('/templates', getTemplates);

// List all templates (ZAPI + Evolution)
router.get('/templates/all', getAllTemplates);

// Provider management
router.get('/providers', getProviders);
router.get('/providers/recommend', getProviderRecommendation);
router.get('/providers/costs', calculateCosts);

// Get broadcast status (all providers)
router.get('/status', getStatus);

// Webhook handler (ZAPI)
router.post('/webhook', validateWebhookRequest, handleWebhook);

// CSV Broadcast Routes
router.post('/csv/process', processCsvBroadcast);
router.post('/csv/upload', uploadCsvFile);
router.get('/csv/sample', generateSampleCsv);
router.post('/csv/validate', validateCsv);
router.post('/csv/test', testBroadcast);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'broadcast',
    providers: ['evolution', 'zapi'],
    csvSupport: true,
    timestamp: new Date().toISOString()
  });
});

export default router;