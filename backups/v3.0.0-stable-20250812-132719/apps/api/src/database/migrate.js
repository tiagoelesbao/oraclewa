import sequelize from './connection.js';
import MessageLog from './models/MessageLog.js';
import WebhookLog from './models/WebhookLog.js';
import logger from '../utils/logger.js';

const migrate = async () => {
  try {
    logger.info('Starting database migration...');
    
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    await sequelize.sync({ force: false, alter: true });
    logger.info('Database models synchronized');
    
    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();