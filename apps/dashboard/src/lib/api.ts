import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { ApiResponse, SystemStats, Client, WhatsAppInstance, WebhookEvent, Template, BroadcastCampaign, AnalyticsData } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth-token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // System APIs
  async getSystemHealth(): Promise<SystemStats> {
    const response = await this.client.get('/health');
    return response.data; // Health endpoint returns direct data, not wrapped
  }

  async getSystemDashboard(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/api/management/dashboard');
    return response.data;
  }

  // Client Management APIs
  async getClients(): Promise<Client[]> {
    const response = await this.client.get('/api/management/clients');
    return response.data.clients || [];
  }

  async getClient(clientId: string): Promise<Client> {
    const response = await this.client.get(`/api/management/clients/${clientId}`);
    return response.data; // Backend returns direct client object
  }

  async createClient(clientData: Partial<Client>): Promise<Client> {
    const response = await this.client.post<ApiResponse<Client>>('/api/management/clients', clientData);
    return response.data.data!;
  }

  async updateClient(clientId: string, clientData: Partial<Client>): Promise<Client> {
    const response = await this.client.put<ApiResponse<Client>>(`/api/management/clients/${clientId}`, clientData);
    return response.data.data!;
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.client.delete(`/api/management/clients/${clientId}`);
  }

  // Instance Management APIs
  async getInstances(): Promise<WhatsAppInstance[]> {
    const response = await this.client.get<WhatsAppInstance[]>('/instance/fetchInstances');
    return response.data;
  }

  async getInstance(instanceName: string): Promise<WhatsAppInstance> {
    const response = await this.client.get<WhatsAppInstance>(`/instance/connectionState/${instanceName}`);
    return response.data;
  }

  async createInstance(instanceData: any): Promise<WhatsAppInstance> {
    const response = await this.client.post<ApiResponse<WhatsAppInstance>>('/instance/create', instanceData);
    return response.data.data!;
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.client.delete(`/instance/delete/${instanceName}`);
  }

  async getInstanceQRCode(instanceName: string): Promise<{ qrcode: string }> {
    const response = await this.client.get<ApiResponse<{ qrcode: string }>>(`/api/management/hetzner/instances/${instanceName}/qrcode`);
    return response.data.data!;
  }

  async getInstanceQRCodeDirect(instanceName: string): Promise<any> {
    const response = await this.client.get(`/api/instances/${instanceName}/qrcode`);
    return response.data;
  }

  async getInstanceStatus(instanceName: string): Promise<any> {
    const response = await this.client.get(`/api/instances/${instanceName}/status`);
    return response.data;
  }

  // Método auxiliar para acessar o client axios diretamente
  get(url: string): Promise<AxiosResponse> {
    return this.client.get(url);
  }

  post(url: string, data?: any): Promise<AxiosResponse> {
    return this.client.post(url, data);
  }

  put(url: string, data?: any): Promise<AxiosResponse> {
    return this.client.put(url, data);
  }

  delete(url: string): Promise<AxiosResponse> {
    return this.client.delete(url);
  }

  // Hetzner Management APIs
  async getHetznerInstances(): Promise<WhatsAppInstance[]> {
    const response = await this.client.get<ApiResponse<{ instances: WhatsAppInstance[] }>>('/api/management/hetzner/instances');
    return response.data.data?.instances || [];
  }

  async createHetznerInstances(clientId: string): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/management/hetzner/instances/${clientId}/create`);
    return response.data;
  }

  async syncHetznerInstances(): Promise<any> {
    const response = await this.client.post<ApiResponse>('/api/management/hetzner/sync');
    return response.data;
  }

  // Broadcast APIs
  async getBroadcastCampaigns(clientId?: string): Promise<BroadcastCampaign[]> {
    const url = clientId ? `/api/broadcast/campaigns?clientId=${clientId}` : '/api/broadcast/campaigns';
    const response = await this.client.get<ApiResponse<BroadcastCampaign[]>>(url);
    return response.data.data || [];
  }

  async createBroadcastCampaign(campaignData: any): Promise<BroadcastCampaign> {
    const response = await this.client.post<ApiResponse<BroadcastCampaign>>('/api/broadcast/campaigns', campaignData);
    return response.data.data!;
  }

  async sendBroadcast(broadcastData: FormData): Promise<any> {
    const response = await this.client.post<ApiResponse>('/api/broadcast/csv', broadcastData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Template APIs
  async getTemplates(clientId?: string): Promise<Template[]> {
    const url = clientId ? `/api/templates?clientId=${clientId}` : '/api/templates';
    const response = await this.client.get<ApiResponse<Template[]>>(url);
    return response.data.data || [];
  }

  async createTemplate(templateData: Partial<Template>): Promise<Template> {
    const response = await this.client.post<ApiResponse<Template>>('/api/templates', templateData);
    return response.data.data!;
  }

  async updateTemplate(templateId: string, templateData: Partial<Template>): Promise<Template> {
    const response = await this.client.put<ApiResponse<Template>>(`/api/templates/${templateId}`, templateData);
    return response.data.data!;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.client.delete(`/api/templates/${templateId}`);
  }

  // Webhook APIs
  async getWebhookEvents(clientId?: string): Promise<WebhookEvent[]> {
    const url = clientId ? `/api/webhooks/events?clientId=${clientId}` : '/api/webhooks/events';
    const response = await this.client.get<ApiResponse<WebhookEvent[]>>(url);
    return response.data.data || [];
  }

  // Analytics APIs
  async getAnalytics(period: string = '7d'): Promise<AnalyticsData> {
    const response = await this.client.get<ApiResponse<AnalyticsData>>(`/api/analytics?period=${period}`);
    return response.data.data!;
  }

  // Chip Maturation APIs
  async getChipMaturationStats(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/api/chip-maturation/stats');
    return response.data;
  }

  async addChipsToPool(chips: any[]): Promise<any> {
    const response = await this.client.post<ApiResponse>('/api/chip-maturation/add', { chips });
    return response.data;
  }

  // Logs APIs
  async getLogs(level?: string, limit: number = 100): Promise<any[]> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    params.append('limit', limit.toString());
    
    const response = await this.client.get<ApiResponse<any[]>>(`/api/logs?${params}`);
    return response.data.data || [];
  }
}

export const api = new ApiClient();
export default api;