export default {
  app: {
    port: process.env.APP_PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'oraclewa',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  evolution: {
    baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost',
    instances: [
      {
        id: 'instance-1',
        port: process.env.EVOLUTION_INSTANCE_1_PORT || 8081,
        apiKey: process.env.EVOLUTION_API_KEY_1
      },
      {
        id: 'instance-2',
        port: process.env.EVOLUTION_INSTANCE_2_PORT || 8082,
        apiKey: process.env.EVOLUTION_API_KEY_2
      },
      {
        id: 'instance-3',
        port: process.env.EVOLUTION_INSTANCE_3_PORT || 8083,
        apiKey: process.env.EVOLUTION_API_KEY_3
      },
      {
        id: 'instance-4',
        port: process.env.EVOLUTION_INSTANCE_4_PORT || 8084,
        apiKey: process.env.EVOLUTION_API_KEY_4
      }
    ]
  },
  security: {
    webhookSecret: process.env.WEBHOOK_SECRET,
    jwtSecret: process.env.JWT_SECRET
  },
  rateLimit: {
    perInstance: parseInt(process.env.RATE_LIMIT_PER_INSTANCE || '500')
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};