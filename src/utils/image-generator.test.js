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
      const image = await generateTeamPlayoffOddsImage({
        team: {
          name: 'Nashville Predators',
          hashtag: 'Preds',
          abbreviation: 'NSH',
          teamColor: '#FFB81C',
          standing: {
            conferenceAbbrev: 'W',
            conferenceHomeSequence: 10,
            conferenceL10Sequence: 1,
            conferenceName: 'Western',
            conferenceRoadSequence: 2,
            conferenceSequence: 6,
            date: '2024-03-24',
            divisionAbbrev: 'C',
            divisionHomeSequence: 6,
            divisionL10Sequence: 1,
            divisionName: 'Central',
            divisionRoadSequence: 2,
            divisionSequence: 4,
            gameTypeId: 2,
            gamesPlayed: 71,
            goalDifferential: 25,
            goalDifferentialPctg: 0.352113,
            goalAgainst: 206,
            goalFor: 231,
            goalsForPctg: 3.253521,
            homeGamesPlayed: 36,
            homeGoalDifferential: 7,
            homeGoalsAgainst: 108,
            homeGoalsFor: 115,
            homeLosses: 15,
            homeOtLosses: 1,
            homePoints: 41,
            homeRegulationPlusOtWins: 20,
            homeRegulationWins: 16,
            homeTies: 0,
            homeWins: 20,
            l10GamesPlayed: 10,
            l10GoalDifferential: 20,
            l10GoalsAgainst: 17,
            l10GoalsFor: 37,
            l10Losses: 0,
            l10OtLosses: 2,
            l10Points: 18,
            l10RegulationPlusOtWins: 8,
            l10RegulationWins: 8,
            l10Ties: 0,
            l10Wins: 8,
            leagueHomeSequence: 19,
            leagueL10Sequence: 1,
            leagueRoadSequence: 5,
            leagueSequence: 11,
            losses: 25,
            otLosses: 4,
            placeName: {
              default: 'Nashville',
            },
            pointPctg: 0.619718,
            points: 88,
            regulationPlusOtWinPctg: 0.563380,
            regulationPlusOtWins: 40,
            regulationWinPctg: 0.492958,
            regulationWins: 35,
            roadGamesPlayed: 35,
            roadGoalDifferential: 18,
            roadGoalsAgainst: 98,
            roadGoalsFor: 116,
            roadLosses: 10,
            roadOtLosses: 3,
            roadPoints: 47,
            roadRegulationPlusOtWins: 20,
            roadRegulationWins: 19,
            roadTies: 0,
            roadWins: 22,
            seasonId: 20232024,
            shootoutLosses: 0,
            shootoutWins: 2,
            streakCode: 'W',
            streakCount: 5,
            teamName: {
              default: 'Nashville Predators',
              fr: 'Predators de Nashville',
            },
            teamCommonName: {
              default: 'Predators',
            },
            teamAbbrev: {
              default: 'NSH',
            },
            teamLogo: 'https://assets.nhle.com/logos/nhl/svg/NSH_light.svg',
            ties: 0,
            waiversSequence: 22,
            wildcardSequence: 1,
            winPctg: 0.591549,
            wins: 42,
          },
        },
        odds: 52.1,
        cachedOdds: 49.7,
        updatedAt: 'March 9, 2024 9:03 ET',
      });
      expect(image).toBeDefined();
      expect(image.length).toBeGreaterThan(0);
      expect(image.length).toBeLessThan(1000000);

      // Write for manual inspection
      fs.writeFileSync('./tmp/team.png', image);
    });
  });
});
