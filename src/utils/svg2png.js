import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';
import logger from './logger.js';

const svgFileUrl = process.argv[2];
if (!svgFileUrl) {
  logger.error('Please provide a URL to an SVG file as the first argument.');
  process.exit(1);
}

const pngFilePath = path.join('src', 'assets', 'images', 'team_logos', `${path.basename(svgFileUrl, '.svg')}.png`);

async function convertSvgToPng() {
  try {
    // Fetch the SVG image
    const response = await fetch(svgFileUrl);
    const svgArrayBuffer = await response.arrayBuffer();
    const svgBuffer = Buffer.from(svgArrayBuffer);

    // Load the SVG image
    const svgImage = await loadImage(svgBuffer);

    // Calculate the scaling factor to fit the image within 400x400
    const { width, height } = svgImage;
    const scaleFactor = Math.min(400 / width, 400 / height);

    // Calculate the centered position
    const scaledWidth = width * scaleFactor;
    const scaledHeight = height * scaleFactor;
    const offsetX = (400 - scaledWidth) / 2;
    const offsetY = (400 - scaledHeight) / 2;

    // Create a canvas and draw the SVG image on it, scaled to fit and centered
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, 400, 400);

    // Translate and scale the context
    ctx.translate(offsetX, offsetY);
    ctx.scale(scaleFactor, scaleFactor);

    // Draw the SVG image onto the canvas
    ctx.drawImage(svgImage, 0, 0);

    // Write the canvas to a PNG file
    const pngBuffer = canvas.toBuffer('image/png');
    fs.mkdirSync(path.dirname(pngFilePath), { recursive: true });
    fs.writeFileSync(pngFilePath, pngBuffer);

    logger.info(`Converted ${svgFileUrl} to ${pngFilePath}`);
  } catch (error) {
    logger.error('Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();
