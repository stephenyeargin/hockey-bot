import fs from 'node:fs';
import nock from 'nock';
import { generateLeaguePlayoffOddsImage, generateTeamPlayoffOddsImage } from './image-generator.js';

describe('Mastodon', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('generateLeaguePlayoffOddsImage', () => {
    it('should generate an image', async () => {
      const standings = await JSON.parse(fs.readFileSync('./src/test/fixtures/standings.json', 'utf-8'));
      const sportsClubStatsOdds = {
        ANA: 0.0021,
        UTA: 0.014,
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
      };
      const moneyPuckOdds = {
        ANA: 0,
        UTA: 0.09,
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
      };
      const updatedAt = 'March 9, 2024 9:03 ET';
      const image = await generateLeaguePlayoffOddsImage({
        standings: standings.standings,
        odds: {
          SCS: sportsClubStatsOdds,
          MP: moneyPuckOdds,
        },
        updatedAt,
      });
      expect(image).toBeDefined();
      expect(image.length).toBeGreaterThan(0);
      expect(image.length).toBeLessThan(1000000);

      // Write for manual inspection
      fs.writeFileSync('./tmp/league.png', image);
    });
  });

  describe('generateTeamPlayoffOddsImage', () => {
    it('should generate an image', async () => {
      const sportsClubStatsOdds = 50.52;
      const moneyPuckOdds = 49.57;
      const updatedAt = 'March 9, 2024 9:03 ET';
      const image = await generateTeamPlayoffOddsImage({
        team: {
          name: 'Nashville Predators',
          hashtag: 'Preds',
          abbreviation: 'NSH',
          teamColor: '#FFB81C',
        },
        odds: {
          'Sports Club Stats': sportsClubStatsOdds,
          MoneyPuck: moneyPuckOdds,
        },
        updatedAt,
      });
      expect(image).toBeDefined();
      expect(image.length).toBeGreaterThan(0);
      expect(image.length).toBeLessThan(1000000);

      // Write for manual inspection
      fs.writeFileSync('./tmp/team.png', image);
    });
  });
});
