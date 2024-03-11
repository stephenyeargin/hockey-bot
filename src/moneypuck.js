import axios from 'axios';
import dayjs from 'dayjs';
import { parse } from 'csv-parse';
import logger from './utils/logger.js';

const MONEYPUCK_UPDATED_TS_URL = 'https://moneypuck.com/moneypuck/simulations/update_date.txt';
const MONEYPUCK_CSV_FILE_URL = 'https://moneypuck.com/moneypuck/simulations/simulations_recent.csv';

const MoneyPuck = {
  getLastUpdate: async () => new Promise((resolve, reject) => {
    axios.get(MONEYPUCK_UPDATED_TS_URL)
      .then((response) => resolve(dayjs(response.data)))
      .catch(reject);
  }),
  getLiveOdds: async (teamCode) => new Promise((resolve, reject) => {
    axios.get(MONEYPUCK_CSV_FILE_URL)
      .then((response) => {
        parse(response.data, {
          columns: true,
          skip_empty_lines: true,
        }, (err, rows) => {
          if (err) {
            return reject(err);
          }
          const teamRow = rows.find((row) => (row.teamCode === teamCode));
          logger.trace(teamRow);
          if (!teamRow) {
            return reject(new Error('No team found'));
          }
          return resolve(teamRow.madePlayoffs * 100);
        });
      })
      .catch(reject);
  }),
};

export default MoneyPuck;
