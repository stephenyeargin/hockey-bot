import axios from 'axios';
import process from 'node:process';
import fs from 'node:fs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import minMax from 'dayjs/plugin/minMax.js';
import timezone from 'dayjs/plugin/timezone.js';
import getRedisClient from './utils/redis.js';
import logger from './utils/logger.js';
import MoneyPuck from './moneypuck.js';
import { generateLeaguePlayoffOddsImage, generateTeamPlayoffOddsImage } from './utils/image-generator.js';
import { formatOdds } from './utils/text.js';
import { postImageToMastodon, postMessageToMastodon } from './utils/mastodon.js';

// Date formatting settings
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(minMax);

const {
  TEAM_CODE, REDIS_URL, MASTODON_BASE_URL, MASTODON_TOKEN,
} = process.env;

// Check configuration
if (!REDIS_URL || !MASTODON_BASE_URL || !MASTODON_TOKEN) {
  logger.error('Missing configuration. Exiting ...');
  process.exit(1);
}

// Find team in the dataset
const Teams = JSON.parse(fs.readFileSync('./src/data/teams.json', 'utf-8'));
let teamList = [];
if (!TEAM_CODE) {
  teamList = Teams.map((t) => t.abbreviation);
} else {
  teamList = [TEAM_CODE?.toUpperCase()];
}
if (!teamList.length) {
  logger.error('No teams found. Exiting ...');
  process.exit(1);
}

// Connect to Redis
const redisClient = await getRedisClient(REDIS_URL);

// If argv contains --cache:clear, remove key and exit
if (process.argv.includes('--cache:clear')) {
  logger.info('Clearing cache for \'hockey-bot-odds-league\' ...');
  await redisClient.del('hockey-bot-odds-league');
  const promises = Teams.map(async (team) => {
    logger.info(`Clearing cache for 'hockey-bot-odds-${team.abbreviation}' ...`);
    await redisClient.del(`hockey-bot-odds-${team.abbreviation}`);
  });
  await Promise.all(promises);
  process.exit(0);
}

// Get cached odds
const cachedLeagueOdds = await redisClient.get('hockey-bot-odds-league') || {};

let moneyPuckOdds;
let moneyPuckLastUpdate;
try {
  moneyPuckOdds = await MoneyPuck.getLeagueLiveOdds();
  moneyPuckLastUpdate = await MoneyPuck.getLastUpdate();
} catch (e) {
  logger.error('Could not retrieve MoneyPuck live odds!');
  logger.error(e);
  moneyPuckOdds = cachedLeagueOdds.moneyPuckOdds || {};
  moneyPuckLastUpdate = new Date(0);
}

// Compare new odds to cached odds
if (cachedLeagueOdds === JSON.stringify({ moneyPuckOdds })) {
  logger.info('Odds in cache match, no updates needed.');
  process.exit(0);
}

// Use latest timestamp
const updatedAt = dayjs(dayjs.max([
  moneyPuckLastUpdate,
])).tz('America/New_York').format('MMMM D, YYYY h:mm A ET');

// Get NHL standings
const standings = await axios.get(`https://api-web.nhle.com/v1/standings/${dayjs().format('YYYY-MM-DD')}`)
  .then((response) => response.data.standings)
  .catch((error) => {
    logger.error('Could not retrieve league standings!');
    logger.error(error);
    process.exit(1);
  });

Teams.map((team) => {
  const teamStandings = standings.find((s) => s.teamAbbrev.default === team.abbreviation);
  if (teamStandings) {
    // eslint-disable-next-line no-param-reassign
    team.standing = teamStandings;
  }
  return team;
});

/**
 * Post latest league odds to Mastodon.
 * @param {object} standings
 * @param {object} odds
 */
const postLeagueOdds = async () => {
  if (standings.length === 0) {
    logger.warn('No league standings available, skipping league odds');
    return false;
  }

  const image = await generateLeaguePlayoffOddsImage({
    teams: Teams,
    standings,
    odds: {
      MP: moneyPuckOdds,
    },
    updatedAt,
  });

  // Build caption
  let description = '';
  standings
    .sort((a, b) => {
      if (a.wildcardSequence === b.wildcardSequence) {
        if (a.divisionAbbrev === b.divisionAbbrev) {
          return (a.divisionSequence > b.divisionSequence) ? 1 : -1;
        }
        return (a.divisionAbbrev > b.divisionAbbrev) ? 1 : -1;
      }
      return (a.wildcardSequence > b.wildcardSequence) ? 1 : -1;
    })
    .forEach((team) => {
      const clinchIndicator = team.clinchIndicator ? ` (${team.clinchIndicator})` : '';
      description += `${team.teamName.default}${clinchIndicator} | MP: ${formatOdds(moneyPuckOdds[team.teamAbbrev.default])}`;
    });
  description += `\nUpdated: ${updatedAt}`;

  // Extract all hashtags from Teams as string (if odds > 0)
  const hashtags = Teams
    .filter((t) => moneyPuckOdds[t.abbreviation] > 0)
    .map((t) => `#${t.hashtag}`).join(' ');

  // Upload image
  const media = await postImageToMastodon({ image, description });

  // Post message to Mastodon
  logger.info('Posting message to Mastodon ...');
  try {
    const status = await postMessageToMastodon({ message: `#nhl ${hashtags}`, media, nonce: description });
    if (status && status.uri) {
      logger.info(`Message posted to Mastodon. Link: ${status.uri}`);
      logger.debug(status);
    }
    return status;
  } catch (error) {
    logger.error('Failed to post league odds!');
    logger.debug(error);
    return process.exit(1);
  }
};

/**
 * Post latest team odds to Mastodon.
 * @param {string} teamCode Abbreviation for team
 * @returns void
 */
const postTeamOdds = async ({ teamCode, thread }) => {
  // Validate Team Code
  const team = Teams.find((t) => t.abbreviation === teamCode.toUpperCase());
  if (!team) {
    logger.error(`Invalid team code: ${teamCode}`);
    process.exit(1);
  }

  logger.info(`Posting odds for ${team.name} ...`);

  // MoneyPuck
  logger.debug({ moneyPuckOdds: moneyPuckOdds[team.abbreviation], moneyPuckLastUpdate });
  const showMoneyPuckOdds = dayjs().diff(moneyPuckLastUpdate, 'day') < 2;

  // Bail out if odds are too stale
  if (!showMoneyPuckOdds) {
    logger.error('No recent odds available.');
    return;
  }

  // Check if new odds match cached value
  const newOdds = JSON.stringify({
    moneyPuckOdds: moneyPuckOdds[team.abbreviation],
  });
  logger.debug({ newOdds });
  const cachedOdds = await redisClient.get(`hockey-bot-odds-${team.abbreviation}`) || '{}';
  logger.debug({ cachedOdds });

  // Exit if no change in odds
  if (cachedOdds === newOdds) {
    logger.info('No update required.');
    return;
  }

  // Don't rub it in
  if (moneyPuckOdds[team.abbreviation] < 0.01) {
    logger.info('Odds are zero.');
    return;
  }

  // Build consolidated message
  let message = `Updated playoff chances for the ${team.name}:\n\n`;
  if (showMoneyPuckOdds) {
    message += `• MoneyPuck: ${formatOdds(moneyPuckOdds[team.abbreviation])}\n`;
  }
  message += `\n\n#NHL  #${team.hashtag} #${team.abbreviation} #${team.name.replace(/(\s|\.)/g, '')}`;
  logger.debug(message);

  // Generating image
  logger.info('Generating image ...');
  const image = await generateTeamPlayoffOddsImage({
    team,
    odds: moneyPuckOdds[team.abbreviation],
    cachedOdds: JSON.parse(cachedOdds)?.moneyPuckOdds[team.abbreviation],
    updatedAt,
  });

  // Post image to Mastodon
  const description = `${message}\n\nUpdated ${updatedAt}`;
  logger.info('Posting image to Mastodon ...');
  let media = null;
  try {
    media = await postImageToMastodon({ image, description });
    if (media && media.id) {
      logger.info(`Image posted to Mastodon. ID: ${media.id}`);
      logger.debug(media);
    }
  } catch (error) {
    logger.error('Failed to post image!');
    logger.debug(error.errors);
    process.exit(1);
  }

  // Post message to Mastodon
  logger.info('Posting message to Mastodon ...');
  try {
    const status = await postMessageToMastodon({
      message, media, thread, nonce: message,
    });
    if (status && status.uri) {
      logger.info(`Message posted to Mastodon. Link: ${status.uri}`);
      logger.debug(status);
    }
  } catch (error) {
    logger.error('Failed to team odds!');
    logger.debug(error);
    process.exit(1);
  }

  // Cache the new odds to avoid sending the same update again
  logger.info('Updating cache ...');
  await redisClient.set(`hockey-bot-odds-${team.abbreviation}`, newOdds);
  logger.info('Cache updated.');
};

// Post odds for league
let thread = {};
if (!TEAM_CODE) {
  thread = await postLeagueOdds();
}

// Cache the league odds to avoid sending the same update again
logger.info('Updating cache ...');
await redisClient.set('hockey-bot-odds-league', JSON.stringify({ moneyPuckOdds }));
logger.info('Cache updated.');

// Update odds for each team
// eslint-disable-next-line no-restricted-syntax
for await (const teamCode of teamList) {
  await postTeamOdds({ teamCode, thread });
}

// Clean up connections
process.exit(0);
