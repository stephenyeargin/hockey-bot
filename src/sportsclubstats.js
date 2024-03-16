import axios from 'axios';
import dayjs from 'dayjs';
import logger from './utils/logger.js';

const SPORTS_CLUB_STATS_DATA_FEED = 'http://www.sportsclubstats.com/d/NHL_ChanceWillMakePlayoffs_Small_A.json';

// Cached data
let lastUpdate;
let liveOdds;

const SportsClubStats = {
  getLastUpdate: async () => {
    if (!lastUpdate) {
      const response = await axios.head(SPORTS_CLUB_STATS_DATA_FEED);
      const lastModified = response.headers['last-modified'];
      lastUpdate = dayjs(lastModified);
    }
    return lastUpdate;
  },
  getLiveOdds: async (teamName) => {
    if (!liveOdds) {
      logger.debug('No cache for odds data, making live call ...');
      const response = await axios.get(SPORTS_CLUB_STATS_DATA_FEED);
      liveOdds = response.data;
    } else {
      logger.debug('Using cache for odds data ...');
    }

    const history = liveOdds.data.find((row) => row.label === teamName);
    if (!history) {
      throw new Error(`Could not find team ${teamName}`);
    }
    const odds = history.data[history.data.length - 1];
    return odds;
  },
};

export default SportsClubStats;
