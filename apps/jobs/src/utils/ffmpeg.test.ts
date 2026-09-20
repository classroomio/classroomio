import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSignalstatsYavg } from './ffmpeg';

test('reads YAVG from the metadata=print output', () => {
  const output = 'frame:0    pts:0       pts_time:0\nlavfi.signalstats.YAVG=126.034\n';

  assert.equal(parseSignalstatsYavg(output), 126.034);
});

test('reads a whole-number YAVG and takes the first frame', () => {
  assert.equal(parseSignalstatsYavg('lavfi.signalstats.YAVG=16\nlavfi.signalstats.YAVG=200\n'), 16);
});

test('returns null when ffmpeg printed no YAVG', () => {
  assert.equal(parseSignalstatsYavg('Stream mapping:\n  Stream #0:0 -> #0:0 (png -> wrapped_avframe)'), null);
});

test('does not match the old unreachable YAVG: format', () => {
  assert.equal(parseSignalstatsYavg('YAVG:126'), null);
});
