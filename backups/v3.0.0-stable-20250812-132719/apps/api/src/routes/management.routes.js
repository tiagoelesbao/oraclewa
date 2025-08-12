/**
 * Management Routes
 * Endpoints para gerenciamento do sistema SaaS
 */

import { Router } from 'express';
import providerManager from '../providers/manager/provider-manager.js';
import multiTenantConfig from '../config/multi-tenant-config.js';
import broadcastManager from '../modules/broadcast/broadcast-manager.js';
import costCalculator from '../services/billing/cost-calculator.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================
// PROVIDER MANAGEMENT
// ============================================

// Listar providers disponíveis
router.get('/providers', async (req, res) => {
  try {
    const comparison = providerManager.getProviderComparison();
    res.json({
      success: true,
      providers: comparison
    });
  } catch (error) {
    logger.error('Error listing providers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recomendar provider para uso específico
router.post('/providers/recommend', async (req, res) => {
  try {
    const useCase = req.body;
    const recommendations = costCalculator.recommendProvider(useCase);
    
    res.json({
      success: true,
      recommendations,
      useCase
    });
  } catch (error) {
    logger.error('Error recommending provider:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check de providers
router.get('/providers/health', async (req, res) => {
  try {
    const healthChecks = await providerManager.healthCheckAll();
    res.json({
      success: true,
      health: healthChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error checking provider health:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CLIENT MANAGEMENT
// ============================================

// Listar todos os clientes
router.get('/clients', async (req, res) => {
  try {
    const { status, provider, plan } = req.query;
    let clients = multiTenantConfig.getAllClients();
    
    // Filtros
    if (status) clients = clients.filter(c => c.status === status);
    if (provider) clients = clients.filter(c => c.provider === provider);
    if (plan) clients = clients.filter(c => c.billing.plan === plan);
    
    res.json({
      success: true,
      clients: clients.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        provider: c.provider,
        plan: c.billing.plan,
        services: c.services,
        createdAt: c.createdAt,
        estimatedCost: c.billing.estimatedCost
      })),
      total: clients.length
    });
  } catch (error) {
    logger.error('Error listing clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter cliente específico
router.get('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = multiTenantConfig.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({
      success: true,
      client
    });
  } catch (error) {
    logger.error('Error getting client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar novo cliente
router.post('/clients', async (req, res) => {
  try {
    const clientData = req.body;
    const newClient = await multiTenantConfig.createClient(clientData);
    
    res.status(201).json({
      success: true,
      client: newClient,
      message: 'Client created successfully'
    });
  } catch (error) {
    logger.error('Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cliente
router.put('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;
    
    const updatedClient = await multiTenantConfig.updateClient(clientId, updates);
    
    res.json({
      success: true,
      client: updatedClient,
      message: 'Client updated successfully'
    });
  } catch (error) {
    logger.error('Error updating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar cliente
router.delete('/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    await multiTenantConfig.deleteClient(clientId);
    
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting client:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// COST MANAGEMENT
// ============================================

// Calcular custos para configuração
router.post('/costs/calculate', async (req, res) => {
  try {
    const config = req.body;
    const comparison = costCalculator.compareCosts(config);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    logger.error('Error calculating costs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Projeções de crescimento
router.post('/costs/projections', async (req, res) => {
  try {
    const { baseConfig, scenarios } = req.body;
    const projections = costCalculator.projectGrowthCosts(baseConfig, scenarios);
    
    res.json({
      success: true,
      projections
    });
  } catch (error) {
    logger.error('Error calculating projections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Relatório de custos detalhado
router.post('/costs/report', async (req, res) => {
  try {
    const { clientId, config } = req.body;
    const report = costCalculator.generateCostReport(clientId, config);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Error generating cost report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BROADCAST MANAGEMENT
// ============================================

// Criar campanha de broadcast
router.post('/broadcast/campaigns', async (req, res) => {
  try {
    const { clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }
    
    const campaignData = req.body;
    const campaign = await broadcastManager.createCampaign(clientId, campaignData);
    
    res.status(201).json({
      success: true,
      campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    logger.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar campanhas de um cliente
router.get('/broadcast/campaigns', async (req, res) => {
  try {
    const { clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }
    
    const campaigns = broadcastManager.getClientCampaigns(clientId);
    
    res.json({
      success: true,
      campaigns,
      total: campaigns.length
    });
  } catch (error) {
    logger.error('Error listing campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter campanha específica
router.get('/broadcast/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = broadcastManager.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    logger.error('Error getting campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parar campanha
router.post('/broadcast/campaigns/:campaignId/stop', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await broadcastManager.stopCampaign(campaignId);
    
    res.json({
      success: true,
      result,
      message: 'Campaign stopped successfully'
    });
  } catch (error) {
    logger.error('Error stopping campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retomar campanha
router.post('/broadcast/campaigns/:campaignId/resume', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await broadcastManager.resumeCampaign(campaignId);
    
    res.json({
      success: true,
      result,
      message: 'Campaign resumed successfully'
    });
  } catch (error) {
    logger.error('Error resuming campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SYSTEM STATS & MONITORING
// ============================================

// Dashboard geral do sistema
router.get('/dashboard', async (req, res) => {
  try {
    const systemStats = multiTenantConfig.getSystemStats();
    const providerHealth = await providerManager.healthCheckAll();
    const broadcastStats = broadcastManager.getStats();
    
    res.json({
      success: true,
      dashboard: {
        system: systemStats,
        providers: providerHealth,
        broadcast: broadcastStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrar cliente de provider
router.post('/clients/:clientId/migrate', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { fromProvider, toProvider, instanceName } = req.body;
    
    const result = await providerManager.migrateInstance(
      instanceName,
      fromProvider,
      toProvider,
      { clientId }
    );
    
    res.json({
      success: true,
      result,
      message: 'Migration completed successfully'
    });
  } catch (error) {
    logger.error('Error migrating client:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;