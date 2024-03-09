import process from 'node:process';
import axios from 'axios';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import getRedisClient from './src/utils/redis.js';
import logger from './src/utils/logger.js';
import MoneyPuck from './src/moneypuck.js';
import SportsClubStats from './src/sportsclubstats.js';

// Load configuration from environment
dotenv.config({
  debug: process.env.LOG_LEVEL === 'debug',
  encoding: 'utf-8',
  path: ['.env.local', '.env.development', '.env.production', '.env'],
});
const { TEAM_NAME } = process.env;
const { TEAM_CODE } = process.env;
const { REDIS_URL } = process.env;
const { MASTODON_BASE_URL } = process.env;
const { MASTODON_TOKEN } = process.env;

// Check configuration (all values should be set)
if (!TEAM_NAME || !TEAM_CODE || !REDIS_URL || !MASTODON_BASE_URL || !MASTODON_TOKEN) {
  logger.error('Missing configuration. Exiting ...');
  process.exit(1);
}

// Connect to Redis
const redisClient = await getRedisClient(REDIS_URL);

/**
 * Post Message to Mastodon
 * @param {string} message
 * @returns
 */
const postMessageToMastodon = (message) => new Promise((resolve, reject) => {
  axios.post(`${MASTODON_BASE_URL}/api/v1/statuses`, {
    status: message,
  }, {
    headers: {
      Authorization: `Bearer ${MASTODON_TOKEN}`,
    },
  })
    .then((response) => {
      logger.debug(response.data);
      resolve(response.data);
    })
    .catch(reject);
});

// If argv contains --cache:clear, remove key and exit
if (process.argv.includes('--cache:clear')) {
  logger.info('Clearing cache ...');
  await redisClient.del(`hockey-bot-odds-${TEAM_CODE}`);
  process.exit(0);
}

// Sports Club Stats
logger.info('Retrieving data from SportsClubStats ...');
const sportsClubStatsOdds = await SportsClubStats.getLiveOdds(TEAM_NAME);
const sportsClubStatsLastUpdate = await SportsClubStats.getLastUpdate();
logger.debug({ sportsClubStatsOdds, sportsClubStatsLastUpdate });

// MoneyPuck
logger.info('Retrieving data from MoneyPuck ...');
const moneyPuckOdds = await MoneyPuck.getLiveOdds(TEAM_CODE);
const moneyPuckLastUpdate = await MoneyPuck.getLastUpdate();
logger.debug({ moneyPuckOdds, moneyPuckLastUpdate });

// Build consolidated message
let message = `Update on playoff chances for the ${TEAM_NAME}:\n\n`;
if (dayjs().diff(sportsClubStatsLastUpdate, 'day') < 3) {
  message += `SportsClubStats: ${sportsClubStatsOdds.toFixed(1)}%\n`;
}
if (dayjs().diff(moneyPuckLastUpdate, 'day') < 3) {
  message += `MoneyPuck: ${moneyPuckOdds.toFixed(1)}%`;
}
logger.debug(message);

// Check if message matches cached value
const cachedOdds = await redisClient.get(`hockey-bot-odds-${TEAM_CODE}`);
logger.debug({ cachedOdds });

// Exit if no change in odds
if (cachedOdds === message) {
  logger.info('No update required.');
  process.exit(0);
}

// Post message to Mastodon
logger.info('Posting message to Mastodon ...');
try {
  const status = await postMessageToMastodon(message);
  if (status && status.uri) {
    logger.info(`Message posted to Mastodon. Link: ${status.uri}`);
    logger.debug(status);
  }
} catch (error) {
  logger.error(error);
  process.exit(1);
}

// Cache the message to avoid sending it again
logger.info('Updating cache ...');
await redisClient.set(`hockey-bot-odds-${TEAM_CODE}`, message);
logger.info('Cache updated.');

// Clean up connections
process.exit(0);
