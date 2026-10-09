import Redis from 'ioredis';
import crypto from 'crypto';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = new Redis(redisUrl);

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

const REFRESH_EXPIRES_IN_SEC = 7 * 24 * 60 * 60; // 7 days

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(40).toString('hex');
  // Store token in redis mapped to user
  await redisClient.set(`refresh:${token}`, userId, 'EX', REFRESH_EXPIRES_IN_SEC);
  return token;
};

export const verifyAndConsumeRefreshToken = async (token: string): Promise<string | null> => {
  const key = `refresh:${token}`;
  const userId = await redisClient.get(key);
  if (userId) {
    // Consume it (One-time use)
    await redisClient.del(key);
    return userId;
  }
  return null;
};
