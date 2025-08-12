/**
 * Interface base para todos os providers de WhatsApp
 * Define o contrato que todos os providers devem implementar
 */

export class WhatsAppProviderInterface {
  constructor(config) {
    this.config = config;
    this.name = 'base';
    this.type = 'unknown';
    this.capabilities = {
      buttons: false,
      images: false,
      videos: false,
      documents: false,
      audio: false,
      location: false,
      contacts: false,
      stickers: false,
      reactions: false,
      lists: false,
      typing: false,
      presence: false,
      groups: false,
      broadcast: false,
      webhooks: false
    };
    this.costs = {
      setup: 0,
      monthly: 0,
      perInstance: 0,
      perMessage: 0
    };
    this.limits = {
      messagesPerDay: 1000,
      messagesPerHour: 100,
      instancesMax: 10,
      contactsPerInstance: 10000
    };
  }

  async initialize() {
    throw new Error('Method initialize() must be implemented');
  }

  async createInstance(instanceName, config = {}) {
    throw new Error('Method createInstance() must be implemented');
  }

  async deleteInstance(instanceName) {
    throw new Error('Method deleteInstance() must be implemented');
  }

  async getInstanceStatus(instanceName) {
    throw new Error('Method getInstanceStatus() must be implemented');
  }

  async connectInstance(instanceName) {
    throw new Error('Method connectInstance() must be implemented');
  }

  async disconnectInstance(instanceName) {
    throw new Error('Method disconnectInstance() must be implemented');
  }

  async sendTextMessage(instanceName, to, text, options = {}) {
    throw new Error('Method sendTextMessage() must be implemented');
  }

  async sendButtonMessage(instanceName, to, content, buttons, options = {}) {
    throw new Error('Method sendButtonMessage() must be implemented');
  }

  async sendListMessage(instanceName, to, content, sections, options = {}) {
    throw new Error('Method sendListMessage() must be implemented');
  }

  async sendMediaMessage(instanceName, to, mediaUrl, caption = '', type = 'image', options = {}) {
    throw new Error('Method sendMediaMessage() must be implemented');
  }

  async sendContactMessage(instanceName, to, contact, options = {}) {
    throw new Error('Method sendContactMessage() must be implemented');
  }

  async sendLocationMessage(instanceName, to, latitude, longitude, options = {}) {
    throw new Error('Method sendLocationMessage() must be implemented');
  }

  async getMessages(instanceName, limit = 100) {
    throw new Error('Method getMessages() must be implemented');
  }

  async getContacts(instanceName) {
    throw new Error('Method getContacts() must be implemented');
  }

  async getGroups(instanceName) {
    throw new Error('Method getGroups() must be implemented');
  }

  async setWebhook(instanceName, webhookUrl, events = []) {
    throw new Error('Method setWebhook() must be implemented');
  }

  async getWebhook(instanceName) {
    throw new Error('Method getWebhook() must be implemented');
  }

  async simulateTyping(instanceName, to, duration = 3000) {
    throw new Error('Method simulateTyping() must be implemented');
  }

  async setPresence(instanceName, presence = 'available') {
    throw new Error('Method setPresence() must be implemented');
  }

  async getQRCode(instanceName) {
    throw new Error('Method getQRCode() must be implemented');
  }

  async logout(instanceName) {
    throw new Error('Method logout() must be implemented');
  }

  async getProfile(instanceName) {
    throw new Error('Method getProfile() must be implemented');
  }

  async checkNumberExists(instanceName, phoneNumber) {
    throw new Error('Method checkNumberExists() must be implemented');
  }

  async getInstanceMetrics(instanceName) {
    return {
      messagesTotal: 0,
      messagesToday: 0,
      messagesHour: 0,
      contacts: 0,
      groups: 0,
      status: 'unknown',
      uptime: 0
    };
  }

  async healthCheck() {
    return {
      status: 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  calculateCost(usage = {}) {
    const { instances = 0, messages = 0, months = 1 } = usage;
    return {
      setup: this.costs.setup,
      monthly: this.costs.monthly * months,
      instances: this.costs.perInstance * instances * months,
      messages: this.costs.perMessage * messages,
      total: this.costs.setup + (this.costs.monthly * months) + (this.costs.perInstance * instances * months) + (this.costs.perMessage * messages)
    };
  }

  isCapable(capability) {
    return this.capabilities[capability] === true;
  }

  getCapabilities() {
    return { ...this.capabilities };
  }

  getCosts() {
    return { ...this.costs };
  }

  getLimits() {
    return { ...this.limits };
  }
}

export default WhatsAppProviderInterface;