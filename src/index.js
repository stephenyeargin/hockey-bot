import process from 'node:process';
import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import minMax from 'dayjs/plugin/minMax.js';
import timezone from 'dayjs/plugin/timezone.js';
import getRedisClient from './utils/redis.js';
import logger from './utils/logger.js';
import MoneyPuck from './moneypuck.js';
import SportsClubStats from './sportsclubstats.js';
import generateImage from './utils/imageGenerator.js';
import { formatOdds } from './utils/text.js';

// Date formatting settings
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(minMax);

// Load configuration from environment
dotenv.config({
  debug: process.env.LOG_LEVEL === 'debug',
  encoding: 'utf-8',
  path: ['.env.local', '.env.development', '.env.production', '.env'],
});
const { TEAM_CODE } = process.env;
const { REDIS_URL } = process.env;
const { MASTODON_BASE_URL } = process.env;
const { MASTODON_TOKEN } = process.env;

// Check configuration (all values should be set)
if (!TEAM_CODE || !REDIS_URL || !MASTODON_BASE_URL || !MASTODON_TOKEN) {
  logger.error('Missing configuration. Exiting ...');
  process.exit(1);
}

// Find team in the dataset
const Teams = JSON.parse(fs.readFileSync('./src/data/teams.json', 'utf-8'));
const team = Teams.find((t) => t.abbreviation === TEAM_CODE.toUpperCase());
if (!team) {
  logger.error(`Invalid team code: ${TEAM_CODE}`);
  process.exit(1);
}

// Connect to Redis
const redisClient = await getRedisClient(REDIS_URL);

/**
 * Post image to Mastodon
 * @param {Buffer} image Image to post
 * @returns
 */
const postImageToMastodon = (image, message) => new Promise((resolve, reject) => {
  const form = new FormData();
  form.append('file', image, {
    filename: 'image.png',
    filepath: 'image.png',
    contentType: 'image/png',
    knownLength: image.length,
  });
  form.append('description', message);

  axios.post(`${MASTODON_BASE_URL}/api/v1/media`, form, {
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

/**
 * Post Message to Mastodon
 * @param {string} message
 * @param {object} media
 * @returns
 */
const postMessageToMastodon = (message, media) => new Promise((resolve, reject) => {
  axios.post(`${MASTODON_BASE_URL}/api/v1/statuses`, {
    status: message,
    media_ids: [media.id],
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
  await redisClient.del(`hockey-bot-odds-${team.abbreviation}`);
  process.exit(0);
}

// Sports Club Stats
logger.info('Retrieving data from Sports Club Stats ...');
const sportsClubStatsOdds = await SportsClubStats.getLiveOdds(team.name);
const sportsClubStatsLastUpdate = await SportsClubStats.getLastUpdate();
logger.debug({ sportsClubStatsOdds, sportsClubStatsLastUpdate });
const showSportsClubStatsOdds = dayjs().diff(sportsClubStatsLastUpdate, 'day') < 7;

// MoneyPuck
logger.info('Retrieving data from MoneyPuck ...');
const moneyPuckOdds = await MoneyPuck.getLiveOdds(team.abbreviation);
const moneyPuckLastUpdate = await MoneyPuck.getLastUpdate();
logger.debug({ moneyPuckOdds, moneyPuckLastUpdate });
const showMoneyPuckOdds = dayjs().diff(moneyPuckLastUpdate, 'day') < 7;

// Bail out if odds are too stale
if (!showSportsClubStatsOdds && !showMoneyPuckOdds) {
  logger.error('No recent odds available.');
  process.exit(0);
}

// Check if message matches cached value
const newOdds = JSON.stringify({
  sportsClubStatsOdds,
  moneyPuckOdds,
});
const cachedOdds = await redisClient.get(`hockey-bot-odds-${team.abbreviation}`);
logger.debug({ cachedOdds });

// Exit if no change in odds
if (process.env.LOG_LEVEL !== 'debug' && cachedOdds === newOdds) {
  logger.info('No update required.');
  process.exit(0);
}

// Don't rub it in
if (sportsClubStatsOdds === 0 && moneyPuckOdds === 0) {
  logger.info('Odds are zero.');
  process.exit(0);
}

// Build consolidated message
let message = `Updated playoff chances for the ${team.name}:\n\n`;
if (showSportsClubStatsOdds) {
  message += `• Sports Club Stats: ${formatOdds(sportsClubStatsOdds)}\n`;
}
if (showMoneyPuckOdds) {
  message += `• MoneyPuck: ${formatOdds(moneyPuckOdds)}\n`;
}
message += `\n\n#NHL #${team.hashtag} #${team.abbreviation} #${team.name.replace(' ', '')}`;
logger.debug(message);

// Use latest timestamp
const updatedAt = dayjs(dayjs.max([
  sportsClubStatsLastUpdate,
  moneyPuckLastUpdate,
])).tz('America/New_York').format('MMMM D, YYYY h:mm A ET');

// Generating image
logger.info('Generating image ...');
const image = await generateImage({
  team,
  sportsClubStatsOdds: showSportsClubStatsOdds
    ? sportsClubStatsOdds
    : false,
  moneyPuckOdds: showMoneyPuckOdds
    ? moneyPuckOdds
    : false,
  updatedAt,
});

// Post image to Mastodon
logger.info('Posting image to Mastodon ...');
let media = null;
try {
  media = await postImageToMastodon(image, message);
  if (media && media.id) {
    logger.info(`Image posted to Mastodon. ID: ${media.id}`);
    logger.debug(media);
  }
} catch (error) {
  logger.error(error);
  process.exit(1);
}

// Post message to Mastodon
logger.info('Posting message to Mastodon ...');
try {
  const status = await postMessageToMastodon(message, media);
  if (status && status.uri) {
    logger.info(`Message posted to Mastodon. Link: ${status.uri}`);
    logger.debug(status);
  }
} catch (error) {
  logger.error(error);
  process.exit(1);
}

// Cache the new odds to avoid sending the same update again
logger.info('Updating cache ...');
await redisClient.set(`hockey-bot-odds-${team.abbreviation}`, newOdds);
logger.info('Cache updated.');

// Clean up connections
process.exit(0);
