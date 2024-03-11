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
    expect(lastUpdate.format()).toEqual('2024-03-08T23:50:54-06:00');
  });

  it('should get live odds', async () => {
    nock('https://moneypuck.com')
      .get('/moneypuck/simulations/simulations_recent.csv')
      .replyWithFile(200, './src/test/fixtures/moneypuck-odds.csv');

    const odds = await MoneyPuck.getLiveOdds('NSH');
    expect(odds).toEqual(58.35);
  });
});
