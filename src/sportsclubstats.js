import fs from 'node:fs';
import axios from 'axios';
import dayjs from 'dayjs';
import logger from './utils/logger.js';

const SPORTS_CLUB_STATS_DATA_FEED = 'http://www.sportsclubstats.com/d/NHL_ChanceWillMakePlayoffs_Small_A.json';

const SportsClubStats = {
  getLastUpdate: async () => {
    const response = await axios.head(SPORTS_CLUB_STATS_DATA_FEED);
    const lastModified = response.headers['last-modified'];
    return dayjs(lastModified);
  },
  getLeagueLiveOdds: async () => {
    const Teams = JSON.parse(fs.readFileSync('./src/data/teams.json', 'utf-8'));
    const leagueOdds = {};
    try {
      const response = await axios.get(SPORTS_CLUB_STATS_DATA_FEED);
      response.data.data.forEach((history) => {
        const teamCode = Teams.find((t) => history.label === t.name)?.abbreviation;
        if (!teamCode) return;
        leagueOdds[teamCode] = history.data[history.data.length - 1];
      });
    } catch (e) {
      logger.error(e);
      return null;
    }
    return leagueOdds;
  },
};

export default SportsClubStats;
