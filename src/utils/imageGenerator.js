import * as PImage from 'pureimage';
import fs from 'fs';
import STREAM from 'node:stream';
import logger from './logger.js';
import { formatOdds } from './text.js';

const { PassThrough } = STREAM;
const attributionLine = process.env.ATTRIBUTION_LINE || '@hockeybot@botsin.space';

// Load fonts
const GothicA1Black = PImage.registerFont(
  './src/assets/fonts/GothicA1-Black.ttf',
  'GothicA1-Black',
  900,
);
const GothicA1Regular = PImage.registerFont(
  './src/assets/fonts/GothicA1-Regular.ttf',
  'GothicA1-Regular',
  400,
);

const generateLeaguePlayoffOddsImage = async ({
  teams, standings, sportsClubStatsOdds, moneyPuckOdds, updatedAt,
}) => {
  // Canvas background
  const backgroundStream = await fs.createReadStream('./src/assets/images/puck-bg.png');

  // Team logos
  const teamLogos = {};
  await teams.forEach(async (team) => {
    teamLogos[team.abbreviation] = await PImage.decodePNGFromStream(
      fs.createReadStream(`./src/assets/images/team_logos/${team.abbreviation}_light.png`),
    );
  });

  const wildcardRankings = ['1', '2', '3', '1', '2', '3', 'WC1', 'WC2', '', '', '', '', '', '', '', 11];

  // Draw
  return PImage.decodePNGFromStream(backgroundStream).then(async (img) => {
    GothicA1Black.loadSync();
    GothicA1Regular.loadSync();

    const ctx = img.getContext('2d');
    ctx.antialias = 'subpixel';
    ctx.filter = 'none';
    ctx.fillStyle = '#111111';

    // Data Source Headings
    ctx.font = '12pt GothicA1-Black';
    ctx.textAlign = 'left';
    ctx.fillText('Western Conference', 40, 30);
    ctx.textAlign = 'center';
    ctx.fillText('SCS', 280, 30);
    ctx.fillText('MP', 340, 30);
    ctx.textAlign = 'left';
    ctx.fillText('Eastern Conference', 440, 30);
    ctx.textAlign = 'center';
    ctx.fillText('SCS', 660, 30);
    ctx.fillText('MP', 720, 30);

    const drawStandings = (conferenceAbbrev, xOffset) => standings
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
      .forEach((team, i) => {
        const logo = teamLogos[team.teamAbbrev.default];
        ctx.drawImage(logo, xOffset, 40 + (i * 30), 30, 30);
        ctx.font = '10pt GothicA1-Regular';
        ctx.textAlign = 'center';
        ctx.fillText(wildcardRankings[i], xOffset - 20, 60 + (i * 30));
        ctx.font = '14pt GothicA1-Regular';
        ctx.textAlign = 'left';
        ctx.fillText(team.teamName.default, xOffset + 40, 60 + (i * 30));
        ctx.textAlign = 'right';
        ctx.font = '14pt GothicA1-Black';
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
    drawStandings('W', 60);

    // Eastern Conference
    drawStandings('E', 440);

    // Updated
    ctx.font = '8pt GothicA1-Regular';
    ctx.textAlign = 'center';
    ctx.fillText(`Updated: ${updatedAt}`, 400, 530);

    // Return stream of data
    logger.info('Encoding ...');
    const pngData = [];
    const passThroughStream = new PassThrough();
    passThroughStream.on('data', (chunk) => pngData.push(chunk));
    passThroughStream.on('end', () => {});
    await PImage.encodePNGToStream(img, passThroughStream);
    return Buffer.concat(pngData);
  });
};

const generateTeamPlayoffOddsImage = async ({
  team, sportsClubStatsOdds, moneyPuckOdds, updatedAt,
}) => {
  // Canvas background
  const backgroundStream = await fs.createReadStream('./src/assets/images/puck-bg.png');

  // Team logo
  const logo = await PImage.decodePNGFromStream(
    await fs.createReadStream(`./src/assets/images/team_logos/${team.abbreviation}_light.png`),
  );

  // Draw
  return PImage.decodePNGFromStream(backgroundStream).then(async (img) => {
    GothicA1Black.loadSync();
    GothicA1Regular.loadSync();

    const ctx = img.getContext('2d');
    ctx.antialias = 'subpixel';
    ctx.filter = 'none';

    // Heading Background Box
    ctx.fillStyle = team.teamColor || '#111111';
    ctx.fillRect(40, 40, 720, 80);

    // Heading
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '26pt GothicA1-Black';
    ctx.textAlign = 'center';
    ctx.fillText((`Playoff odds for the ${team.name}`).toUpperCase(), 400, 90);

    // Team Logo
    ctx.drawImage(logo, 360, 90, 400, 400);

    let currentYPosition = 190;

    // MoneyPuck
    if (moneyPuckOdds) {
      ctx.fillStyle = '#000080';
      ctx.font = '30pt GothicA1-Black';
      ctx.fillText('MoneyPuck', 230, currentYPosition);

      ctx.fillStyle = '#800000';
      ctx.font = '60pt GothicA1-Black';
      ctx.fillText(formatOdds(moneyPuckOdds), 230, currentYPosition + 70);
      currentYPosition = 330;
    }

    // Sports Club Stats
    if (sportsClubStatsOdds) {
      ctx.fillStyle = '#000080';
      ctx.font = '30pt GothicA1-Black';
      ctx.fillText('Sports Club Stats', 230, currentYPosition);

      ctx.fillStyle = '#800000';
      ctx.font = '60pt GothicA1-Black';
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
    const pngData = [];
    const passThroughStream = new PassThrough();
    passThroughStream.on('data', (chunk) => pngData.push(chunk));
    passThroughStream.on('end', () => {});
    await PImage.encodePNGToStream(img, passThroughStream);
    return Buffer.concat(pngData);
  });
};

export {
  generateLeaguePlayoffOddsImage,
  generateTeamPlayoffOddsImage,
};
