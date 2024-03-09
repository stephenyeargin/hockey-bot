import axios from 'axios';
import dayjs from 'dayjs';
import logger from './utils/logger.js';

const SPORTS_CLUB_STATS_DATA_FEED = 'http://www.sportsclubstats.com/d/NHL_ChanceWillMakePlayoffs_Small_A.json';

const SportsClubStats = {
  getLastUpdate: async () => new Promise((resolve, reject) => {
    axios.get(SPORTS_CLUB_STATS_DATA_FEED)
      .then((response) => {
        const lastModified = response.headers['last-modified'];
        resolve(dayjs(lastModified).format());
      })
      .catch(reject);
  }),
  getLiveOdds: async (teamName) => new Promise((resolve, reject) => {
    axios.get(SPORTS_CLUB_STATS_DATA_FEED)
      .then((response) => {
        const dataFeed = response.data;
        const history = dataFeed.data.find((row) => row.label === teamName);
        const odds = history.data[history.data.length - 1];
        logger.trace(dataFeed);
        resolve(odds);
      })
      .catch(reject);
  }),
};

export default SportsClubStats;
