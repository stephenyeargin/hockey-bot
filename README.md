# Hockey Bot

[![Node CI](https://github.com/stephenyeargin/hockey-bot/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hockey-bot/actions/workflows/nodejs.yml) [![CodeQL](https://github.com/stephenyeargin/hockey-bot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/stephenyeargin/hockey-bot/actions/workflows/codeql-analysis.yml)

Posts the latest playoff odds for the configured team to Mastodon.

## Requirements

* NodeJS >= 16
* Redis server
* [Mastodon API Key](https://docs.joinmastodon.org/client/intro/)

May also have [additional requirements for `canvas`](https://github.com/Automattic/node-canvas/blob/master/Readme.md), depending on the operating system.

## Configuration

These values must be set in the running process's environment. You can use a tool like [`dotenv`](https://github.com/motdotla/dotenv) or the newer [`dotenvx`](https://dotenvx.com/).

| Environment Variable | Required? | Description | Example |
| -------------------- | --------- | ----------- | ------- |
| `TEAM_CODE`          | No[^1]    | Abbreviation of team (as shown on MoneyPuck) | `NSH` |
| `REDIS_URL`          | Yes       | URL of a Redis server | `redis://localhost:6379` |
| `MASTODON_BASE_URL`  | Yes       | Base URL of the Mastodon server | `https://mastodon.social` |
| `MASTODON_TOKEN`     | Yes       | API token for your bot | `someratherlong_apitoken123` |

[^1]: If set, it will skip the league-wide post. If not set or empty, it will generate posts for all teams with greater than a 0.01% chance.

## Running

The bot is designed to be run on a regular schedule (likely no more than hourly) via `cron` or similar service.

```
0 * * * * cd your/path && dotenv --file .env.development run -- npm start
```

## Commands

### `npm start`

Runs the application

### `npm run start:dev`

Produces more verbose output for debugging.

### `npm run cache:clear`

Resets the Redis cache, may result in a duplicate post.

### `npm test`

Runs the test suite.
