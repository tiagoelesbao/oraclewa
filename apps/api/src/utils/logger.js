import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const transports = [];

// Em produção (Railway), usar apenas console
if (process.env.NODE_ENV === 'production') {
  transports.push(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  // Em desenvolvimento, usar arquivos de log
  try {
    transports.push(
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  } catch (error) {
    // Se falhar, usar apenas console
    transports.push(new winston.transports.Console({
      format: consoleFormat
    }));
  }
}

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports
});

// Console já configurado acima baseado no ambiente

export default logger;