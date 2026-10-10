import assert from 'node:assert/strict';
import { extractYoutubeId, resolveVideoId, stripYoutubeLines } from './changelog-video.ts';
import { CHANGELOG_VIDEOS } from '../data/changelog-videos.ts';

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

assert.equal(resolveVideoId('entry-1', 'no link', { 'entry-1': 'AAAAAAAAAAA' }), 'AAAAAAAAAAA');
assert.equal(
  resolveVideoId('entry-1', 'Video: https://youtu.be/BBBBBBBBBBB', { 'entry-1': 'AAAAAAAAAAA' }),
  'AAAAAAAAAAA'
);
assert.equal(resolveVideoId('entry-2', 'Video: https://youtu.be/BBBBBBBBBBB', {}), 'BBBBBBBBBBB');
assert.equal(resolveVideoId('entry-2', 'no link', { 'entry-1': 'AAAAAAAAAAA' }), null);

for (const [entryId, videoId] of Object.entries(CHANGELOG_VIDEOS)) {
  assert.match(videoId, /^[A-Za-z0-9_-]{11}$/, `registry video id for ${entryId} is not a YouTube id`);
}

console.log('changelog-video tests passed');
