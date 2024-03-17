import axios from 'axios';
import dayjs from 'dayjs';
import { parse } from 'csv-parse';
import logger from './utils/logger.js';

const MONEYPUCK_UPDATED_TS_URL = 'https://moneypuck.com/moneypuck/simulations/update_date.txt';
const MONEYPUCK_CSV_FILE_URL = 'https://moneypuck.com/moneypuck/simulations/simulations_recent.csv';

// Cached data
let lastUpdate;
let liveOdds;

const MoneyPuck = {
  getLastUpdate: async () => {
    if (!lastUpdate) {
      const response = await axios.get(MONEYPUCK_UPDATED_TS_URL);
      lastUpdate = dayjs(response.data);
      return lastUpdate;
    }
    return lastUpdate;
  },
  getLiveOdds: async (teamCode) => {
    if (!liveOdds) {
      logger.debug('No cache for odds data, making live call ...');
      const response = await axios.get(MONEYPUCK_CSV_FILE_URL);
      const parsedData = await new Promise((resolve, reject) => {
        parse(response.data, {
          columns: true,
          skip_empty_lines: true,
        }, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      liveOdds = parsedData;
    } else {
      logger.debug('Using cache for odds data ...');
    }

    const teamRow = liveOdds.find((row) => row.teamCode === teamCode);
    if (!teamRow) {
      throw new Error('No team found');
    }
    return teamRow.madePlayoffs * 100;
  },
};

export default MoneyPuck;
