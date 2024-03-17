import axios from 'axios';
import axiosRetry from 'axios-retry';
import FormData from 'form-data';
import { hashCode } from './text.js';
import logger from './logger.js';

// Configure axios-retry
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

/**
 * Load configuration from environment variables
 * @returns Object
 */
const loadConfiguration = () => {
  const { MASTODON_BASE_URL, MASTODON_TOKEN } = process.env;
  if (!MASTODON_BASE_URL || !MASTODON_TOKEN) {
    throw new Error('Mastodon configuration not found!');
  }
  return {
    MASTODON_BASE_URL,
    MASTODON_TOKEN,
  };
};

/**
 * Post image to Mastodon
 * @param {Buffer} image Image to post
 * @returns
 */
export const postImageToMastodon = ({ image, description }) => new Promise((resolve, reject) => {
  const { MASTODON_BASE_URL, MASTODON_TOKEN } = loadConfiguration();
  const form = new FormData();
  form.append('file', image, {
    filename: 'image.png',
    filepath: 'image.png',
    contentType: 'image/png',
    knownLength: image.length,
  });
  form.append('description', description);

  axios.post(`${MASTODON_BASE_URL}/api/v1/media`, form, {
    headers: {
      Authorization: `Bearer ${MASTODON_TOKEN}`,
    },
  })
    .then((response) => {
      if (response.headers['x-ratelimit-remaining'] === '0') {
        logger.warn('Mastodon rate limit reached!');
        logger.debug(response.headers);
      }
      logger.debug(response.data);
      resolve(response.data);
    })
    .catch(reject);
});

/**
 * Post Message to Mastodon
 * @param {string} message
 * @param {object} media
 * @returns
 */
export const postMessageToMastodon = ({ message, media }) => new Promise((resolve, reject) => {
  const { MASTODON_BASE_URL, MASTODON_TOKEN } = loadConfiguration();
  axios.post(`${MASTODON_BASE_URL}/api/v1/statuses`, {
    status: message,
    media_ids: [media.id],
    visibility: 'public',
  }, {
    headers: {
      Authorization: `Bearer ${MASTODON_TOKEN}`,
      'Idempotency-Key': hashCode(message),
    },
  })
    .then((response) => {
      if (response.headers['x-ratelimit-remaining'] === '0') {
        logger.warn('Mastodon rate limit reached!');
        logger.debug(response.headers);
      }
      logger.debug(response.data);
      resolve(response.data);
    })
    .catch(reject);
});