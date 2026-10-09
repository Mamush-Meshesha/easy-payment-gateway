import { PrismaClient } from '@prisma/client';

// Singleton Prisma client — prevents connection pool exhaustion in tests and production.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

export default prisma;
