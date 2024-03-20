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
      ARI: 0.09,
      BOS: 99.82,
      BUF: 2.18,
      CAR: 99.24,
      CBJ: 0,
      CGY: 7.470000000000001,
      CHI: 0,
      COL: 98.36,
      DAL: 99.7,
      DET: 69.64,
      EDM: 96.05,
      FLA: 99.95,
      LAK: 90.21000000000001,
      MIN: 18.5,
      MTL: 0,
      NJD: 8.07,
      NSH: 49.57,
      NYI: 4.12,
      NYR: 100,
      OTT: 1.3,
      PHI: 54.98,
      PIT: 29.49,
      SEA: 12.94,
      SJS: 0,
      STL: 7.03,
      TBL: 79.59,
      TOR: 98.65,
      VAN: 99.97,
      VGK: 87.32,
      WPG: 99.67,
      WSH: 12,
    });
  });
});
