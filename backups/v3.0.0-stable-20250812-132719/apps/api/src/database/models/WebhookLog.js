import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('order_expired', 'order_paid', 'carrinho_abandonado', 'venda_expirada', 'venda_aprovada'),
    allowNull: false,
    index: true
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('received', 'processing', 'processed', 'failed'),
    defaultValue: 'received',
    index: true
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'webhook_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['createdAt']
    },
    {
      fields: ['type', 'status']
    }
  ]
});

export default WebhookLog;