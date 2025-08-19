'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

// Types
export interface Client {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  instances: Instance[];
  createdAt: Date;
  settings: ClientSettings;
}

export interface Instance {
  id: string;
  name: string;
  instanceName?: string; // Para compatibilidade com QRCodeModal
  clientId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'warming' | 'error';
  provider: 'evolution' | 'baileys' | 'zapi';
  phone?: string;
  qrCode?: string;
  messagesCount: number;
  lastActivity?: Date;
  maturationLevel: 'new' | 'warming' | 'mature';
  dailyLimit: number;
  antibanSettings: AntibanSettings;
  functionType: 'webhook' | 'broadcast' | 'support'; // Função da instância
}

export interface AntibanSettings {
  strategy: 'conti_chips' | 'aggressive' | 'conservative';
  delayMin: number; // milliseconds
  delayMax: number; // milliseconds
  dailyLimit: number;
  hourlyLimit: number;
  batchSize: number;
  pauseBetweenBatches: number; // minutes
  respectWarmupPeriod: boolean;
}

export interface ClientSettings {
  timezone: string;
  antibanStrategy: string;
  maxInstancesAllowed: number;
  webhookUrl?: string;
  notificationEmail?: string;
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  clientId: string;
  instanceIds: string[];
  templateId: string;
  targetList: ContactTarget[];
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  progress: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  settings: CampaignSettings;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  logs: CampaignLog[];
}

export interface ContactTarget {
  id: string;
  name: string;
  phone: string;
  variables?: Record<string, string>;
}

export interface CampaignSettings {
  antibanSettings: AntibanSettings;
  scheduleType: 'immediate' | 'scheduled' | 'recurring';
  scheduledTime?: Date;
  recurringPattern?: string;
  useVariations: boolean;
  variationIds?: string[];
}

export interface CampaignLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  contactId?: string;
  instanceId?: string;
  details?: any;
}

export interface Template {
  id: string;
  name: string;
  clientId: string;
  content: string;
  variables: string[];
  variations: TemplateVariation[];
  category: 'marketing' | 'support' | 'notification' | 'recovery';
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface TemplateVariation {
  id: string;
  name: string;
  content: string;
  weight: number; // percentage
}

// Context State
interface AppState {
  // Data
  clients: Client[];
  instances: Instance[];
  campaigns: BroadcastCampaign[];
  templates: Template[];
  
  // UI State
  selectedClient: Client | null;
  selectedInstances: Instance[];
  loading: boolean;
  error: string | null;
  
  // Real-time data
  systemStats: any;
  realTimeLogs: CampaignLog[];
}

// Context Actions
interface AppActions {
  // Client Management
  selectClient: (client: Client | null) => void;
  createClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Instance Management
  selectInstances: (instances: Instance[]) => void;
  createInstance: (instanceData: Omit<Instance, 'id' | 'messagesCount' | 'lastActivity'>) => Promise<Instance>;
  connectInstance: (id: string) => Promise<void>;
  disconnectInstance: (id: string) => Promise<void>;
  updateInstanceSettings: (id: string, settings: Partial<AntibanSettings>) => Promise<void>;
  
  // Campaign Management
  createCampaign: (campaignData: Omit<BroadcastCampaign, 'id' | 'createdAt' | 'progress' | 'logs'>) => Promise<BroadcastCampaign>;
  startCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
  cancelCampaign: (id: string) => Promise<void>;
  getCampaignLogs: (id: string, realTime?: boolean) => Promise<CampaignLog[]>;
  
  // Template Management
  createTemplate: (templateData: Omit<Template, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Data Loading
  refreshData: () => Promise<void>;
  loadSystemStats: () => Promise<void>;
}

interface AppContextType extends AppState, AppActions {}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Default values
const defaultAntibanSettings: AntibanSettings = {
  strategy: 'conti_chips',
  delayMin: 30000, // 30 seconds
  delayMax: 120000, // 2 minutes
  dailyLimit: 100,
  hourlyLimit: 15,
  batchSize: 10,
  pauseBetweenBatches: 15, // 15 minutes
  respectWarmupPeriod: true,
};

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    clients: [],
    instances: [],
    campaigns: [],
    templates: [],
    selectedClient: null,
    selectedInstances: [],
    loading: false,
    error: null,
    systemStats: null,
    realTimeLogs: [],
  });

  // Client Management
  const selectClient = (client: Client | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedClient: client,
      selectedInstances: client ? prev.instances.filter(i => i.clientId === client.id) : []
    }));
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.createClient(clientData);
      const newClient: Client = {
        ...clientData,
        id: response.id,
        createdAt: new Date(),
        instances: [],
      };
      
      setState(prev => ({
        ...prev,
        clients: [...prev.clients, newClient],
        loading: false,
      }));
      
      return newClient;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.updateClient(id, updates);
      setState(prev => ({
        ...prev,
        clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.deleteClient(id);
      setState(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== id),
        instances: prev.instances.filter(i => i.clientId !== id),
        selectedClient: prev.selectedClient?.id === id ? null : prev.selectedClient,
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Instance Management
  const selectInstances = (instances: Instance[]) => {
    setState(prev => ({ ...prev, selectedInstances: instances }));
  };

  const createInstance = async (instanceData: Omit<Instance, 'id' | 'messagesCount' | 'lastActivity'>): Promise<Instance> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.createInstance({
        instanceName: instanceData.name,
        clientId: instanceData.clientId,
        ...instanceData,
      });
      
      const newInstance: Instance = {
        ...instanceData,
        id: response.instanceName || instanceData.name,
        messagesCount: 0,
        lastActivity: new Date().toISOString(),
        maturationLevel: 'warming',
        phone: '',
        antibanSettings: { ...defaultAntibanSettings, ...instanceData.antibanSettings },
      };
      
      setState(prev => ({
        ...prev,
        instances: [...prev.instances, newInstance],
        loading: false,
      }));
      
      return newInstance;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const connectInstance = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Para Evolution API, apenas marcar como connecting
      // O QR Code será buscado pelo modal
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(i => 
          i.id === id 
            ? { ...i, status: 'connecting' }
            : i
        ),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const disconnectInstance = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.deleteInstance(id);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(i => 
          i.id === id ? { ...i, status: 'disconnected', qrCode: undefined } : i
        ),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const updateInstanceSettings = async (id: string, settings: Partial<AntibanSettings>): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.put(`/instances/${id}/settings`, settings);
      setState(prev => ({
        ...prev,
        instances: prev.instances.map(i => 
          i.id === id 
            ? { ...i, antibanSettings: { ...i.antibanSettings, ...settings } }
            : i
        ),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Campaign Management
  const createCampaign = async (campaignData: Omit<BroadcastCampaign, 'id' | 'createdAt' | 'progress' | 'logs'>): Promise<BroadcastCampaign> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.createBroadcastCampaign(campaignData);
      const newCampaign: BroadcastCampaign = {
        ...campaignData,
        id: response.id,
        createdAt: new Date(),
        progress: { total: campaignData.targetList.length, sent: 0, delivered: 0, failed: 0, pending: campaignData.targetList.length },
        logs: [],
      };
      
      setState(prev => ({
        ...prev,
        campaigns: [...prev.campaigns, newCampaign],
        loading: false,
      }));
      
      return newCampaign;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const startCampaign = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Use broadcast CSV API for now until specific start endpoint is available
      const campaign = state.campaigns.find(c => c.id === id);
      if (campaign) {
        const formData = new FormData();
        const csvContent = campaign.targetList.map(contact => 
          `${contact.name},${contact.phone}`
        ).join('\n');
        formData.append('csv', new Blob([csvContent], { type: 'text/csv' }));
        
        await api.sendBroadcast(formData);
      }
      
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => 
          c.id === id ? { ...c, status: 'running', startedAt: new Date() } : c
        ),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const pauseCampaign = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Pause functionality would need to be implemented in backend
      console.log('Pause campaign:', id);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => 
          c.id === id ? { ...c, status: 'paused' } : c
        ),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const cancelCampaign = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Cancel functionality would need to be implemented in backend
      console.log('Cancel campaign:', id);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => 
          c.id === id ? { ...c, status: 'cancelled' } : c
        ),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const getCampaignLogs = async (id: string, realTime = false): Promise<CampaignLog[]> => {
    try {
      const logs = await api.getLogs('info', 50);
      const formattedLogs = logs.map((log: any) => ({
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(log.timestamp),
        level: log.level,
        message: log.message,
        details: log.meta,
      }));
      
      if (realTime) {
        setState(prev => ({ ...prev, realTimeLogs: formattedLogs }));
      }
      
      return formattedLogs;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  // Template Management
  const createTemplate = async (templateData: Omit<Template, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<Template> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.createTemplate(templateData);
      const newTemplate: Template = {
        ...templateData,
        id: response.id,
        createdAt: new Date(),
        usageCount: 0,
      };
      
      setState(prev => ({
        ...prev,
        templates: [...prev.templates, newTemplate],
        loading: false,
      }));
      
      return newTemplate;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Template>): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.updateTemplate(id, updates);
      setState(prev => ({
        ...prev,
        templates: prev.templates.map(t => t.id === id ? { ...t, ...updates } : t),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.deleteTemplate(id);
      setState(prev => ({
        ...prev,
        templates: prev.templates.filter(t => t.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // Data Loading
  const refreshData = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Load real data from backend APIs
      const [clientsRes, instancesRes, campaignsRes, templatesRes] = await Promise.all([
        api.getClients(),
        api.getInstances(),
        api.getBroadcastCampaigns(),
        api.getTemplates(),
      ]);

      // Transform backend data to frontend format
      const formattedClients = clientsRes.map((client: any) => ({
        id: client.id,
        name: client.name || client.id,
        description: client.description || `Cliente ${client.name}`,
        status: client.status || 'active',
        instances: [],
        createdAt: new Date(client.createdAt || Date.now()),
        settings: {
          timezone: 'America/Sao_Paulo',
          antibanStrategy: 'conti_chips',
          maxInstancesAllowed: 10,
          webhookUrl: client.webhookUrl,
          notificationEmail: client.email,
        },
      }));

      const formattedInstances = instancesRes.map((instance: any) => ({
        id: instance.instanceName,
        name: instance.instanceName,
        instanceName: instance.instanceName, // Para o QRCodeModal
        clientId: instance.instanceName.includes('imperio') ? 'imperio' : 
                 instance.instanceName.includes('broadcast') ? 'imperio' : 'demo',
        status: instance.status || 'disconnected',
        provider: instance.provider || 'evolution' as const,
        phone: instance.phone,
        qrCode: instance.qrcode,
        messagesCount: instance.messagesCount || 0,
        lastActivity: new Date(instance.lastActivity || Date.now()),
        maturationLevel: instance.maturationLevel || 'new',
        dailyLimit: instance.dailyLimit || 100,
        antibanSettings: defaultAntibanSettings,
        functionType: instance.functionType || 'webhook' as const,
      }));

      const formattedCampaigns = campaignsRes.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        clientId: campaign.clientId,
        instanceIds: campaign.instanceIds || [],
        templateId: campaign.templateId,
        targetList: campaign.targetList || [],
        status: campaign.status,
        progress: {
          total: campaign.messagesTotal || 0,
          sent: campaign.messagesSent || 0,
          delivered: Math.floor((campaign.messagesSent || 0) * (campaign.successRate || 0.95)),
          failed: Math.floor((campaign.messagesSent || 0) * (1 - (campaign.successRate || 0.95))),
          pending: (campaign.messagesTotal || 0) - (campaign.messagesSent || 0),
        },
        settings: campaign.settings || {
          antibanSettings: defaultAntibanSettings,
          scheduleType: 'immediate',
          useVariations: false,
        },
        createdAt: new Date(campaign.createdAt || Date.now()),
        scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt) : undefined,
        startedAt: campaign.startedAt ? new Date(campaign.startedAt) : undefined,
        completedAt: campaign.completedAt ? new Date(campaign.completedAt) : undefined,
        logs: [],
      }));

      const formattedTemplates = templatesRes.map((template: any) => ({
        id: template.id,
        name: template.name,
        clientId: template.clientId,
        content: template.content,
        variables: template.variables || [],
        variations: template.variations || [],
        category: template.category || 'marketing',
        createdAt: new Date(template.createdAt || Date.now()),
        lastUsed: template.lastUsed ? new Date(template.lastUsed) : undefined,
        usageCount: template.usageCount || 0,
      }));

      setState(prev => ({
        ...prev,
        clients: formattedClients,
        instances: formattedInstances,
        campaigns: formattedCampaigns,
        templates: formattedTemplates,
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error loading data from API:', error);
      // Fallback to mock data if API fails
      loadMockData();
      setState(prev => ({ ...prev, loading: false, error: `API Error: ${error.message}` }));
    }
  };

  const loadSystemStats = async (): Promise<void> => {
    try {
      const response = await api.getSystemHealth();
      setState(prev => ({ ...prev, systemStats: response }));
    } catch (error: any) {
      console.error('Error loading system stats:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    // Load real data from backend first, fallback to mock if needed
    refreshData();
    loadSystemStats();
    
    // Set up real-time data polling
    const interval = setInterval(() => {
      loadSystemStats();
      // Refresh data every 2 minutes
      if (Date.now() % 120000 < 30000) {
        refreshData();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Mock data loader for development
  const loadMockData = () => {
    setState(prev => ({
      ...prev,
      clients: [
        {
          id: 'imperio',
          name: 'Império Prêmios',
          description: 'Cliente principal - E-commerce de rifas',
          status: 'active',
          instances: [],
          createdAt: new Date('2024-01-15'),
          settings: {
            timezone: 'America/Sao_Paulo',
            antibanStrategy: 'conti_chips',
            maxInstancesAllowed: 10,
            webhookUrl: 'https://oraclewa-imperio-production.up.railway.app/webhook',
            notificationEmail: 'admin@imperiopremios.com',
          },
        },
        {
          id: 'demo',
          name: 'Cliente Demo',
          description: 'Cliente para demonstração',
          status: 'active',
          instances: [],
          createdAt: new Date('2024-08-01'),
          settings: {
            timezone: 'America/Sao_Paulo',
            antibanStrategy: 'conservative',
            maxInstancesAllowed: 5,
            notificationEmail: 'demo@oraclewa.com',
          },
        },
      ],
      instances: [
        {
          id: 'imperio1',
          name: 'imperio1',
          instanceName: 'imperio1',
          clientId: 'imperio',
          status: 'connected',
          provider: 'evolution',
          phone: '+55 (11) 98266-1537',
          messagesCount: 19821,
          lastActivity: new Date(Date.now() - 10 * 60 * 1000),
          maturationLevel: 'mature',
          dailyLimit: 100,
          antibanSettings: defaultAntibanSettings,
          functionType: 'webhook',
        },
        {
          id: 'broadcast-imperio-hoje',
          name: 'broadcast-imperio-hoje',
          clientId: 'imperio',
          status: 'disconnected',
          provider: 'evolution',
          phone: '+55 (11) 97562-3976',
          messagesCount: 76,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          maturationLevel: 'warming',
          dailyLimit: 50,
          antibanSettings: defaultAntibanSettings,
        },
        {
          id: 'demo-instance',
          name: 'demo-instance',
          clientId: 'demo',
          status: 'connecting',
          provider: 'evolution',
          messagesCount: 0,
          maturationLevel: 'new',
          dailyLimit: 30,
          antibanSettings: defaultAntibanSettings,
        },
      ],
      campaigns: [],
      templates: [
        {
          id: 'template-1',
          name: 'Boas-vindas VIP',
          clientId: 'imperio',
          content: 'Olá {{nome}}! 🎉\n\nSeja bem-vindo(a) ao {{produto}}!\n\nVocê acabou de garantir sua participação em nossa mega promoção com prêmios incríveis.\n\n🏆 Concorra a:\n• {{premio1}}\n• {{premio2}}\n• {{premio3}}\n\n✨ Boa sorte e obrigado por confiar em nós!\n\nResultados em: {{data_sorteio}}',
          variables: ['nome', 'produto', 'premio1', 'premio2', 'premio3', 'data_sorteio'],
          variations: [
            {
              id: 'var1',
              name: 'Casual',
              content: 'Oi {{nome}}! 😊\n\nQue alegria ter você conosco no {{produto}}!\n\nAgora você está concorrendo a prêmios fantásticos:\n🎁 {{premio1}}\n🎁 {{premio2}}\n🎁 {{premio3}}\n\nCruzamos os dedos para você! 🤞\nSorteio dia {{data_sorteio}}!',
              weight: 40,
            },
            {
              id: 'var2',
              name: 'Formal',
              content: 'Prezado(a) {{nome}},\n\nÉ com grande satisfação que confirmamos sua participação no {{produto}}.\n\nVocê está concorrendo aos seguintes prêmios:\n\n1. {{premio1}}\n2. {{premio2}}\n3. {{premio3}}\n\nO sorteio será realizado em {{data_sorteio}}.\n\nDesejamos boa sorte!',
              weight: 60,
            },
          ],
          category: 'marketing',
          createdAt: new Date('2024-08-01'),
          usageCount: 24,
        },
        {
          id: 'template-2',
          name: 'Pedido Confirmado',
          clientId: 'imperio',
          content: '✅ Pedido #{{numero_pedido}} confirmado!\n\nOlá {{nome}}, seu pedido foi processado com sucesso:\n\n📦 Produto: {{produto}}\n💰 Valor: {{valor}}\n🎟️ Números da sorte: {{numeros}}\n\n📱 Acompanhe pelo link: {{link_pedido}}\n\nEm caso de dúvidas, entre em contato conosco!',
          variables: ['numero_pedido', 'nome', 'produto', 'valor', 'numeros', 'link_pedido'],
          variations: [],
          category: 'notification',
          createdAt: new Date('2024-07-15'),
          usageCount: 156,
        },
        {
          id: 'template-3',
          name: 'Carrinho Abandonado',
          clientId: 'imperio',
          content: 'Ei {{nome}}! 🛒\n\nVocê esqueceu algo especial no seu carrinho!\n\n{{produto}} por apenas {{valor}} está te esperando.\n\n⏰ Últimas {{quantidade}} vagas disponíveis!\n\n🎯 Finalize agora e garante sua participação no sorteio de {{premio_principal}}!\n\n👆 Clique aqui para finalizar: {{link_checkout}}',
          variables: ['nome', 'produto', 'valor', 'quantidade', 'premio_principal', 'link_checkout'],
          variations: [
            {
              id: 'var3',
              name: 'Urgência',
              content: '⚠️ {{nome}}, ÚLTIMAS HORAS!\n\nSeu {{produto}} no carrinho por {{valor}} está quase expirando!\n\n🚨 Apenas {{quantidade}} vagas restantes\n\n🏆 Não perca a chance de concorrer ao {{premio_principal}}\n\nFINALIZE AGORA: {{link_checkout}}',
              weight: 100,
            },
          ],
          category: 'recovery',
          createdAt: new Date('2024-07-20'),
          usageCount: 89,
        },
        {
          id: 'template-4',
          name: 'Suporte - Dúvidas',
          clientId: 'demo',
          content: 'Olá {{nome}}! 👋\n\nRecebemos sua mensagem sobre {{assunto}}.\n\nNossa equipe está analisando e retornaremos em até {{tempo_resposta}}.\n\n📞 Urgente? Ligue: {{telefone}}\n📧 Email: {{email_suporte}}\n\nObrigado pela confiança!',
          variables: ['nome', 'assunto', 'tempo_resposta', 'telefone', 'email_suporte'],
          variations: [],
          category: 'support',
          createdAt: new Date('2024-08-05'),
          usageCount: 12,
        },
      ],
      loading: false,
    }));
  };

  const contextValue: AppContextType = {
    // State
    ...state,
    
    // Actions
    selectClient,
    createClient,
    updateClient,
    deleteClient,
    selectInstances,
    createInstance,
    connectInstance,
    disconnectInstance,
    updateInstanceSettings,
    createCampaign,
    startCampaign,
    pauseCampaign,
    cancelCampaign,
    getCampaignLogs,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshData,
    loadSystemStats,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;