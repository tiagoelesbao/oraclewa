import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const MessageLog = sequelize.define('MessageLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('order_expired', 'order_paid', 'carrinho_abandonado', 'venda_expirada', 'venda_aprovada', 'custom'),
    allowNull: false,
    index: true
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
    defaultValue: 'pending',
    index: true
  },
  instanceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'message_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['createdAt']
    },
    {
      fields: ['status', 'type']
    }
  ]
});

export const createMessageLog = async (data) => {
  try {
    const log = await MessageLog.create(data);
    return log;
  } catch (error) {
    throw error;
  }
};

export default MessageLog;