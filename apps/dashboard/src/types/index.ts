// System Types
export interface SystemStats {
  activeClients: number;
  totalClients: number;
  activeInstances: number;
  totalInstances: number;
  messagesProcessed: number;
  uptime: number;
  version: string;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'suspended';
  provider: 'evolution-baileys' | 'z-api';
  services: string[];
  features: {
    buttons: boolean;
    lists: boolean;
    media: boolean;
    typing: boolean;
    presence: boolean;
    groups: boolean;
    reactions: boolean;
  };
  limits: {
    messagesPerDay: number;
    messagesPerHour: number;
    instances: number;
    contactsPerInstance: number;
  };
  billing: {
    plan: string;
    monthlyBudget: number;
    billingCycle: string;
    paymentMethod: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Instance Types
export interface WhatsAppInstance {
  id: string;
  name: string;
  clientId: string;
  type: 'recovery' | 'broadcast';
  provider: string;
  status: 'open' | 'close' | 'connecting' | 'pending';
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  phone?: string;
  token: string;
  connectionStatus: string;
  disconnectionReasonCode?: number;
  disconnectionAt?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    messages: number;
    contacts: number;
    chats: number;
  };
}

// Message Types
export interface Message {
  id: string;
  instanceId: string;
  clientId: string;
  type: 'text' | 'media' | 'template';
  content: string;
  to: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  error?: string;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  clientId: string;
  type: 'order_expired' | 'order_paid' | 'message_received';
  payload: any;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  processedAt?: string;
  error?: string;
  createdAt: string;
}

// Template Types
export interface Template {
  id: string;
  clientId: string;
  name: string;
  type: 'order_expired' | 'order_paid' | 'broadcast';
  content: string;
  variables: string[];
  variations?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Broadcast Types
export interface BroadcastCampaign {
  id: string;
  clientId: string;
  name: string;
  templateId: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// Analytics Types
export interface AnalyticsData {
  period: string;
  messages: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  clients: {
    active: number;
    total: number;
  };
  instances: {
    online: number;
    offline: number;
    total: number;
  };
  revenue?: {
    current: number;
    previous: number;
    growth: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Form Types for UI Components
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface ClientForm {
  name: string;
  description: string;
  services: string[];
  provider: string;
  messagesPerDay: number;
  messagesPerHour: number;
}

export interface BroadcastForm {
  name: string;
  templateId: string;
  csvFile: File;
  scheduledAt?: string;
  testMode?: boolean;
}

export interface TemplateForm {
  name: string;
  type: string;
  content: string;
  variables: string[];
}