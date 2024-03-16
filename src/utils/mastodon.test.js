import fs from 'node:fs';
import nock from 'nock';
import { postMessageToMastodon, postImageToMastodon } from './mastodon.js';

describe('Mastodon', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    process.env.MASTODON_BASE_URL = 'https://social.example.com';
    process.env.MASTODON_TOKEN = 'some_long_token';
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    delete process.env.MASTODON_BASE_URL;
    delete process.env.MASTODON_TOKEN;
  });

  it('should post a message to Mastodon', async () => {
    nock('https://social.example.com')
      .post('/api/v1/statuses')
      .matchHeader('Authorization', 'Bearer some_long_token')
      .reply(200, { id: '123' });

    const result = await postMessageToMastodon({ message: 'Hello world!', media: [456] });
    expect(result).toEqual({ id: '123' });
    expect(nock.isDone()).toBeTruthy();
    expect(nock.pendingMocks()).toEqual([]);
    expect(nock.activeMocks()).toEqual([]);
  });

  it('should post an image to Mastodon', async () => {
    nock('https://social.example.com')
      .post('/api/v1/media')
      .reply(200, { id: '123' });

    const imageMock = await fs.readFileSync('./src/test/fixtures/image.png');

    const result = await postImageToMastodon({ image: imageMock, description: 'a caption' });
    expect(result).toEqual({ id: '123' });
    expect(nock.isDone()).toBeTruthy();
    expect(nock.pendingMocks()).toEqual([]);
    expect(nock.activeMocks()).toEqual([]);
  });
});
