import assert from 'node:assert/strict';
import { extractYoutubeId, stripYoutubeLines } from './changelog-video.ts';

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

console.log('changelog-video tests passed');
