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
 * @param {string} description Image alternate text
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
    .catch((error) => {
      if (error.response) {
        logger.error(error.response.data);
        logger.error(error.response.status);
        logger.error(error.response.headers);
      } else if (error.request) {
        logger.error(error.request);
      } else {
        logger.error('Error', error.message);
      }
      logger.error(error.config);
      reject(error);
    });
});

/**
 * Post Message to Mastodon
 * @param {string} message Message to post
 * @param {object} media Associated image upload
 * @param {object} thread Message to reply to
 * @param {string} nonce Prevent repeated posting
 * @returns
 */
export const postMessageToMastodon = ({
  message, media, thread, nonce,
}) => new Promise((resolve, reject) => {
  const { MASTODON_BASE_URL, MASTODON_TOKEN } = loadConfiguration();
  axios.post(`${MASTODON_BASE_URL}/api/v1/statuses`, {
    status: message,
    media_ids: [media.id],
    visibility: 'public',
    in_reply_to_id: thread?.id || null,
  }, {
    headers: {
      Authorization: `Bearer ${MASTODON_TOKEN}`,
      'Idempotency-Key': hashCode(nonce),
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
    .catch((error) => {
      if (error.response) {
        logger.error(error.response.data);
        logger.error(error.response.status);
        logger.error(error.response.headers);
      } else if (error.request) {
        logger.error(error.request);
      } else {
        logger.error('Error', error.message);
      }
      logger.error(error.config);
      reject(error);
    });
});
