import { createCanvas, loadImage, registerFont } from 'canvas';
import logger from './logger.js';
import { formatOdds } from './text.js';

const SEASON_GAMES_COUNT = 82;
const attributionLine = process.env.ATTRIBUTION_LINE || '@hockeybot@botsin.space';

// Load fonts
registerFont(
  './src/assets/fonts/GothicA1-Black.ttf',
  {
    family: 'GothicA1-Black',
    weight: 900,
  },
);
registerFont(
  './src/assets/fonts/GothicA1-Regular.ttf',
  {
    family: 'GothicA1-Regular',
    weight: 400,
  },
);

/**
 * Generate Team Playoff Odds Image
 * @param {object} parameter.standings
 * @param {object} parameter.sportsClubStatsOdds
 * @param {object} parameter.moneyPuckOdds
 * @param {string} parameter.updatedAt
 * @returns Buffer
 */
const generateLeaguePlayoffOddsImage = async ({
  standings, sportsClubStatsOdds, moneyPuckOdds, updatedAt,
}) => {
  const canvas = createCanvas(810, 560);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 810, 560);

  const wildcardRankings = ['1', '2', '3', '1', '2', '3', 'WC1', 'WC2', '', '', '', '', '', '', '', ''];

  ctx.antialias = 'subpixel';
  ctx.filter = 'none';
  ctx.fillStyle = '#111111';

  // Data Source Headings
  ctx.font = '12pt GothicA1-Black';
  ctx.textAlign = 'left';
  ctx.fillText('Western Conference', 60, 30);
  ctx.textAlign = 'center';
  ctx.fillText('SCS', 285, 30);
  ctx.fillText('MP', 350, 30);
  ctx.textAlign = 'left';
  ctx.fillText('Eastern Conference', 460, 30);
  ctx.textAlign = 'center';
  ctx.fillText('SCS', 685, 30);
  ctx.fillText('MP', 750, 30);

  /**
   * Calculated if team is eliminated from playoffs
   * @param {object} team Team object
   * @param {string} conferenceAbbrev Single letter for conference
   * @returns boolean
   */
  const isEliminated = (team, conferenceAbbrev) => {
    const finalWildCardTeam = standings
      .filter((t) => t.conferenceAbbrev === conferenceAbbrev)
      .find((t) => t.wildcardSequence === 2);
    const targetPoints = finalWildCardTeam.points;
    const maxPoints = ((SEASON_GAMES_COUNT - team.gamesPlayed) * 2) + team.points;
    // Not calculating tie breakers here
    if (maxPoints < targetPoints) {
      return true;
    }
    return false;
  };

  /**
   * Draw Conference Standings
   * @param {string} conferenceAbbrev Single letter for conference
   * @param {integer} xOffset X position for drawing
   * @returns void
   */
  const drawConferenceStandings = async (conferenceAbbrev, xOffset) => {
    standings
      .filter((t) => t.conferenceAbbrev === conferenceAbbrev)
      .sort((a, b) => {
        if (a.wildcardSequence === b.wildcardSequence) {
          if (a.divisionAbbrev === b.divisionAbbrev) {
            return (a.divisionSequence > b.divisionSequence) ? 1 : -1;
          }
          return (a.divisionAbbrev > b.divisionAbbrev) ? 1 : -1;
        }
        return (a.wildcardSequence > b.wildcardSequence) ? 1 : -1;
      })
      .map(async (team, i) => {
        const logo = await loadImage(`./src/assets/images/team_logos/${team.teamAbbrev.default}_light.png`);
        ctx.drawImage(logo, xOffset, 40 + (i * 30), 30, 30);

        let { clinchIndicator } = team;
        if (isEliminated(team, team.conferenceAbbrev)) {
          clinchIndicator = 'e';
        }

        ctx.font = '10pt GothicA1-Regular';
        ctx.textAlign = 'center';
        ctx.fillText(wildcardRankings[i], xOffset - 20, 60 + (i * 30));
        ctx.font = '10pt GothicA1-Regular';
        ctx.textAlign = 'left';
        const teamName = clinchIndicator ? `${team.teamName.default} (${clinchIndicator})` : team.teamName.default;
        ctx.fillText(teamName, xOffset + 35, 60 + (i * 30));
        ctx.textAlign = 'right';
        ctx.font = '10pt GothicA1-Black';
        ctx.fillText(
          formatOdds(sportsClubStatsOdds[team.teamAbbrev.default]),
          xOffset + 250,
          60 + (i * 30),
        );
        ctx.fillText(
          formatOdds(moneyPuckOdds[team.teamAbbrev.default]),
          xOffset + 320,
          60 + (i * 30),
        );

        // Row Divider
        ctx.beginPath();
        ctx.lineWidth = 0.25;
        ctx.setLineDash([1, 1]);
        ctx.strokeStyle = '#999999';
        ctx.moveTo(xOffset, 70 + (i * 30));
        ctx.lineTo(xOffset + 330, 70 + (i * 30));
        ctx.stroke();
      });

    // Division Divider
    ctx.beginPath();
    ctx.lineWidth = 0.25;
    ctx.setLineDash([1, 1]);
    ctx.strokeStyle = '#111111';
    ctx.moveTo(xOffset - 40, 130);
    ctx.lineTo(xOffset + 330, 130);
    ctx.stroke();

    // Wildcard Divider
    ctx.beginPath();
    ctx.lineWidth = 0.25;
    ctx.setLineDash([1, 1]);
    ctx.strokeStyle = '#111111';
    ctx.moveTo(xOffset - 40, 220);
    ctx.lineTo(xOffset + 330, 220);
    ctx.stroke();

    // Cut-off Divider
    ctx.beginPath();
    ctx.lineWidth = 0.25;
    ctx.setLineDash([1, 1]);
    ctx.strokeStyle = '#111111';
    ctx.moveTo(xOffset - 40, 280);
    ctx.lineTo(xOffset + 330, 280);
    ctx.stroke();
  };

  // Western Conference
  await drawConferenceStandings('W', 60);

  // Eastern Conference
  await drawConferenceStandings('E', 460);

  // Credit + timestamp
  ctx.fillStyle = '#999999';
  ctx.font = '8pt GothicA1-Regular';
  ctx.textAlign = 'center';
  ctx.fillText(`${attributionLine} • Updated: ${updatedAt}`, 400, 540);

  // Return stream of data
  logger.info('Encoding ...');
  return Buffer.from(canvas.toDataURL().replace('data:image/png;base64,', ''), 'base64');
};

/**
 * Generate Team Playoff Odds Image
 * @param {object} parameter.team
 * @param {object} parameter.sportsClubStatsOdds
 * @param {object} parameter.moneyPuckOdds
 * @param {string} parameter.updatedAt
 * @returns Buffer
 */
const generateTeamPlayoffOddsImage = async ({
  team, sportsClubStatsOdds, moneyPuckOdds, updatedAt,
}) => {
  const canvas = createCanvas(800, 540);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 540);

  ctx.antialias = 'subpixel';
  ctx.filter = 'none';

  // Heading background box with rounded top corners
  ctx.fillStyle = team.teamColor || '#111111';
  ctx.roundRect(40, 40, 720, 80, [10, 10, 0, 0]);
  ctx.fill();

  // Heading
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18pt GothicA1-Black';
  ctx.textAlign = 'center';
  ctx.fillText((`Playoff odds for the ${team.name}`).toUpperCase(), 400, 90);

  // Team Logo
  const logo = await loadImage(`./src/assets/images/team_logos/${team.abbreviation}_light.png`);
  ctx.drawImage(logo, 360, 90, 400, 400);

  let currentYPosition = 190;

  // MoneyPuck
  if (moneyPuckOdds) {
    ctx.fillStyle = '#000080';
    ctx.font = '24pt GothicA1-Black';
    ctx.fillText('MoneyPuck', 230, currentYPosition);

    ctx.fillStyle = '#800000';
    ctx.font = '48pt GothicA1-Black';
    ctx.fillText(formatOdds(moneyPuckOdds), 230, currentYPosition + 70);
    currentYPosition = 330;
  }

  // Sports Club Stats
  if (sportsClubStatsOdds) {
    ctx.fillStyle = '#000080';
    ctx.font = '24pt GothicA1-Black';
    ctx.fillText('Sports Club Stats', 230, currentYPosition);

    ctx.fillStyle = '#800000';
    ctx.font = '48pt GothicA1-Black';
    ctx.fillText(formatOdds(sportsClubStatsOdds), 230, currentYPosition + 70);
  }

  // Divider
  ctx.fillStyle = team.teamColor || '#111111';
  ctx.fillRect(40, 480, 720, 2);

  // Credit
  ctx.fillStyle = '#999999';
  ctx.font = '16pt GothicA1-Regular';
  ctx.textAlign = 'left';
  ctx.fillText(attributionLine, 50, 510);

  // Timestamp
  ctx.fillStyle = '#999999';
  ctx.font = '16pt GothicA1-Regular';
  ctx.textAlign = 'right';
  ctx.fillText(`Updated ${updatedAt}`, 750, 510);

  // Return stream of data
  logger.info('Encoding ...');
  return Buffer.from(canvas.toDataURL().replace('data:image/png;base64,', ''), 'base64');
};

export {
  generateLeaguePlayoffOddsImage,
  generateTeamPlayoffOddsImage,
};
