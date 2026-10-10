import assert from 'node:assert/strict';
import {
  extractYoutubeId,
  matchVideosToEntries,
  parsePlaylistFeed,
  resolveVideoId,
  stripYoutubeLines
} from './changelog-video.ts';
import { CHANGELOG_VIDEO_OVERRIDES } from '../data/changelog-videos.ts';

assert.equal(extractYoutubeId('Video: https://youtu.be/HojcpzwQqv4'), 'HojcpzwQqv4');
assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=HojcpzwQqv4&t=10s'), 'HojcpzwQqv4');
assert.equal(extractYoutubeId('https://www.youtube.com/watch?feature=share&v=HojcpzwQqv4'), 'HojcpzwQqv4');
assert.equal(extractYoutubeId('[Watch](https://www.youtube.com/embed/HojcpzwQqv4)'), 'HojcpzwQqv4');
assert.equal(extractYoutubeId('https://www.youtube.com/shorts/HojcpzwQqv4'), 'HojcpzwQqv4');
assert.equal(extractYoutubeId('No video here, see https://example.com/watch?v=HojcpzwQqv4'), null);
assert.equal(extractYoutubeId(''), null);

assert.equal(
  stripYoutubeLines('Video: https://youtu.be/HojcpzwQqv4\n\nYou can now do the thing.'),
  '\nYou can now do the thing.'
);
assert.equal(stripYoutubeLines('No video.\nSecond line.'), 'No video.\nSecond line.');

const feed = `<?xml version="1.0"?><feed>
<entry><yt:videoId>AAAAAAAAAAA</yt:videoId><title>One</title><published>2026-10-05T12:25:00+00:00</published></entry>
<entry><yt:videoId>BBBBBBBBBBB</yt:videoId><title>Two</title><published>2026-09-28T04:45:00+00:00</published></entry>
<entry><yt:videoId>bad</yt:videoId><published>2026-09-21T04:45:00+00:00</published></entry>
<entry><yt:videoId>CCCCCCCCCCC</yt:videoId><published>not a date</published></entry>
</feed>`;
const videos = parsePlaylistFeed(feed);

assert.deepEqual(videos, [
  { id: 'AAAAAAAAAAA', publishedAt: '2026-10-05T12:25:00+00:00' },
  { id: 'BBBBBBBBBBB', publishedAt: '2026-09-28T04:45:00+00:00' }
]);
assert.deepEqual(parsePlaylistFeed('not xml'), []);

const entries = [
  { id: 'e-oct5', publishedAt: '2026-10-05T10:49:31.442Z' },
  { id: 'e-sep28', publishedAt: '2026-09-28T04:41:58.186Z' },
  { id: 'e-older', publishedAt: '2026-07-18T09:38:21.009Z' }
];
const matches = matchVideosToEntries(entries, videos);

assert.equal(matches.get('e-oct5'), 'AAAAAAAAAAA');
assert.equal(matches.get('e-sep28'), 'BBBBBBBBBBB');
assert.equal(matches.has('e-older'), false);

const sharedVideo = matchVideosToEntries(
  [
    { id: 'near', publishedAt: '2026-10-05T11:00:00.000Z' },
    { id: 'far', publishedAt: '2026-10-05T20:00:00.000Z' }
  ],
  [{ id: 'AAAAAAAAAAA', publishedAt: '2026-10-05T12:00:00.000Z' }]
);

assert.equal(sharedVideo.get('near'), 'AAAAAAAAAAA');
assert.equal(sharedVideo.has('far'), false);
assert.equal(matchVideosToEntries(entries, []).size, 0);

const playlistMatches = new Map([['entry-1', 'PLAYLISTVID']]);

assert.equal(
  resolveVideoId('entry-1', 'Video: https://youtu.be/BBBBBBBBBBB', { 'entry-1': 'OVERRIDE111' }, playlistMatches),
  'OVERRIDE111'
);
assert.equal(resolveVideoId('entry-1', 'Video: https://youtu.be/BBBBBBBBBBB', {}, playlistMatches), 'PLAYLISTVID');
assert.equal(resolveVideoId('entry-2', 'Video: https://youtu.be/BBBBBBBBBBB', {}, playlistMatches), 'BBBBBBBBBBB');
assert.equal(resolveVideoId('entry-2', 'no link', {}, playlistMatches), null);

for (const [entryId, videoId] of Object.entries(CHANGELOG_VIDEO_OVERRIDES)) {
  assert.match(videoId, /^[A-Za-z0-9_-]{11}$/, `override video id for ${entryId} is not a YouTube id`);
}

console.log('changelog-video tests passed');
