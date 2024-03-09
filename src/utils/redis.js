import { createClient } from 'redis';
import logger from './logger.js';

const REDIS_URL = 'redis://localhost:6379';

const redisClient = createClient();

const connectRedis = async () => {
  redisClient.on('error', (err) => {
    logger.error('[Redis] Client error');
    logger.error(err);
    process.exit(1);
  });
  redisClient.on('connect', () => logger.debug('[Redis] Client connected'));
  redisClient.on('end', () => logger.debug('[Redis] Client disconnected'));
  await redisClient.connect({
    url: REDIS_URL,
  });
};

// Disconnect from Redis
const disconnectRedis = async () => {
  await redisClient.disconnect();
};

// Cleanup on exit
process.on('exit', async (code) => {
  logger.debug(`[Redis] Process ended with code ${code}.`);
  await disconnectRedis();
});

const getRedisClient = async () => {
  await connectRedis();
  return redisClient;
};

export default getRedisClient;
