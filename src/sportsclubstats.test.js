import nock from 'nock';
import SportsClubStats from './sportsclubstats.js';

// Alter time as test runs
const originalDateNow = Date.now;

describe('SportsClubStats', () => {
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

    nock('http://www.sportsclubstats.com')
      .head('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .reply(200, '', {
        'last-modified': 'Sat, 09 Mar 2024 02:39:04 GMT',
      });

    const lastUpdate = await SportsClubStats.getLastUpdate();
    expect(lastUpdate.format()).toEqual('2024-03-09T02:39:04+00:00');
  });

  it('should get league live odds', async () => {
    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(200, './src/test/fixtures/sportsclubstats-odds.json', {
        'last-modified': 'Sat, 09 Mar 2024 02:39:04 GMT',
      });

    const odds = await SportsClubStats.getLeagueLiveOdds();
    expect(odds).toEqual({
      ANA: 0.0021,
      ARI: 0.014,
      BOS: 99.97,
      BUF: 0.84,
      CAR: 99.64,
      CBJ: 0.0083,
      CGY: 16.57,
      CHI: 0,
      COL: 98.88,
      DAL: 99.92,
      DET: 96.08,
      EDM: 98.14,
      FLA: 99.99,
      LAK: 92.04,
      MIN: 18.62,
      MTL: 0.0094,
      NJD: 12.97,
      NSH: 50.52,
      NYI: 8.1,
      NYR: 99.99,
      OTT: 0.19,
      PHI: 59.31,
      PIT: 44.01,
      SEA: 11.06,
      SJS: 0.00018,
      STL: 18.88,
      TBL: 74.35,
      TOR: 98.91,
      VAN: 99.99,
      VGK: 95.4,
      WPG: 99.97,
      WSH: 5.65,
    });
  });
});
