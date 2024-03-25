import { createCanvas, loadImage, registerFont } from 'canvas';
import logger from './logger.js';
import { formatOdds } from './text.js';

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

const generateLeaguePlayoffOddsImage = async ({
  standings, sportsClubStatsOdds, moneyPuckOdds, updatedAt,
}) => {
  // Canvas background
  const canvas = createCanvas(800, 540);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 540);

  const wildcardRankings = ['1', '2', '3', '1', '2', '3', 'WC1', 'WC2', '', '', '', '', '', '', '', ''];

  ctx.antialias = 'subpixel';
  ctx.filter = 'none';
  ctx.fillStyle = '#111111';

  // Data Source Headings
  ctx.font = '12pt GothicA1-Black';
  ctx.textAlign = 'left';
  ctx.fillText('Western Conference', 60, 30);
  ctx.textAlign = 'center';
  ctx.fillText('SCS', 280, 30);
  ctx.fillText('MP', 340, 30);
  ctx.textAlign = 'left';
  ctx.fillText('Eastern Conference', 460, 30);
  ctx.textAlign = 'center';
  ctx.fillText('SCS', 680, 30);
  ctx.fillText('MP', 740, 30);

  const drawStandings = async (conferenceAbbrev, xOffset) => standings
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

      ctx.font = '10pt GothicA1-Regular';
      ctx.textAlign = 'center';
      ctx.fillText(wildcardRankings[i], xOffset - 20, 60 + (i * 30));
      ctx.font = '10pt GothicA1-Regular';
      ctx.textAlign = 'left';
      ctx.fillText(team.teamName.default, xOffset + 40, 60 + (i * 30));
      ctx.textAlign = 'right';
      ctx.font = '10pt GothicA1-Black';
      ctx.fillText(
        formatOdds(sportsClubStatsOdds[team.teamAbbrev.default]),
        xOffset + 240,
        60 + (i * 30),
      );
      ctx.fillText(
        formatOdds(moneyPuckOdds[team.teamAbbrev.default]),
        xOffset + 310,
        60 + (i * 30),
      );
    });

  // Western Conference
  await drawStandings('W', 60);

  // Eastern Conference
  await drawStandings('E', 460);

  // Updated
  ctx.font = '8pt GothicA1-Regular';
  ctx.textAlign = 'center';
  ctx.fillText(`${attributionLine} • Updated: ${updatedAt}`, 400, 530);

  // Return stream of data
  logger.info('Encoding ...');
  return Buffer.from(canvas.toDataURL().replace('data:image/png;base64,', ''), 'base64');
};

const generateTeamPlayoffOddsImage = async ({
  team, sportsClubStatsOdds, moneyPuckOdds, updatedAt,
}) => {
  // Canvas background
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
