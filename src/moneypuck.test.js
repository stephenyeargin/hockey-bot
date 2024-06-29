import nock from 'nock';
import MoneyPuck from './moneypuck.js';

// Alter time as test runs
const originalDateNow = Date.now;

describe('MoneyPuck', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    Date.now = originalDateNow;
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should get updated date', async () => {
    Date.now = () => Date.parse('Fri Mar 9 02:00:00 CST 2024');
    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/update_date.txt')
      .reply(200, '2024-03-09 00:50:54.979432-05:00');

    const lastUpdate = await MoneyPuck.getLastUpdate();
    expect(lastUpdate.format()).toEqual('2024-03-09T05:50:54+00:00');
  });

  it('should get league live odds', async () => {
    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, './src/test/fixtures/moneypuck-odds.csv');

    const odds = await MoneyPuck.getLeagueLiveOdds();
    expect(odds).toEqual({
      ANA: 0,
      BOS: 99.9,
      BUF: 3.25,
      CAR: 99.55000000000001,
      CBJ: 0,
      CGY: 11.53,
      CHI: 0,
      COL: 98.95,
      DAL: 99.82,
      DET: 77.03,
      EDM: 97.87,
      FLA: 99.96000000000001,
      LAK: 93.17,
      MIN: 23.549999999999997,
      MTL: 0.01,
      NJD: 12.42,
      NSH: 58.35,
      NYI: 6.619999999999999,
      NYR: 99.99,
      OTT: 2.09,
      PHI: 63.370000000000005,
      PIT: 35.339999999999996,
      SEA: 17.72,
      SJS: 0,
      STL: 9.21,
      TBL: 85.28999999999999,
      TOR: 99.22,
      UTA: 0.13,
      VAN: 99.98,
      VGK: 89.88000000000001,
      WPG: 99.83,
      WSH: 15.959999999999999,
    });
  });
});
