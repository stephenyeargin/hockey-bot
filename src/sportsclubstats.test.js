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

  it('should get live odds', async () => {
    nock('http://www.sportsclubstats.com')
      .get('/d/NHL_ChanceWillMakePlayoffs_Small_A.json')
      .replyWithFile(200, './src/test/fixtures/sportsclubstats-odds.json', {
        'last-modified': 'Sat, 09 Mar 2024 02:39:04 GMT',
      });

    const odds = await SportsClubStats.getLiveOdds('Nashville Predators');
    expect(odds).toEqual(50.52);
  });
});
