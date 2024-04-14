import axios from 'axios';
import dayjs from 'dayjs';
import { parse } from 'csv-parse';

const MONEYPUCK_UPDATED_TS_URL = 'https://moneypuck.com/moneypuck/simulations/update_date.txt';
const MONEYPUCK_CSV_FILE_URL = 'https://moneypuck.com/moneypuck/simulations/simulations_recent.csv';

const MoneyPuck = {
  getLastUpdate: async () => {
    const response = await axios.get(MONEYPUCK_UPDATED_TS_URL);
    return dayjs(response.data);
  },
  getLeagueLiveOdds: async () => {
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
    const leagueOdds = {};
    parsedData.forEach((row) => {
      if (row.scenerio === 'ALL') {
        leagueOdds[row.teamCode] = row.madePlayoffs * 100;
      }
    });
    return leagueOdds;
  },
};

export default MoneyPuck;
