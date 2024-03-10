# Hockey Bot

Posts the latest playoff odds for the configured team to Mastodon.

## Requirements

* NodeJS > 16
* Redis server
* [Mastodon API Key](https://docs.joinmastodon.org/client/intro/)

## Configuration

Copy the `.env` file to `.env.local` and update with the values below.

| Environment Variable | Description | Example |
| -------------------- | ----------- | ------- |
| `TEAM_CODE`          | Abbreviation of team (as shown on MoneyPuck) | `NSH` |
| `REDIS_URL`          | URL of a Redis server | `redis://localhost:6379` |
| `MASTODON_BASE_URL`  | Base URL of the Mastodon server | `https://mastodon.social` |
| `MASTODON_TOKEN`     | API token for your bot | `someratherlong_apitoken123` |

## Running

The bot is designed to be run on a regular schedule (likely no more than hourly) via `cron` or similar service.

```
0 * * * * cd your/path && npm run start
```

## Other Commands

### `npm run start:dev`

Produces more verbose output for debugging.

### `npm run cache:clear`

Resets the Redis cache, may result in a duplicate post.

### `npm test`

Runs the test suite.
