import winston from 'winston';

const { combine, timestamp, json, errors, splat } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    splat(),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console()
  ],
});
