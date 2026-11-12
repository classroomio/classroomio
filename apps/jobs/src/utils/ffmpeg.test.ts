import { describe, expect, it } from 'vitest';

import { parseMeanLuma } from './ffmpeg';

/**
 * Real ffmpeg output. The metadata form is what current builds emit; the
 * stderr form is what older ones logged, and dropping it would break
 * thumbnails on any host that has not upgraded.
 */
const METADATA_OUTPUT = `
frame=    1 fps=0.0 q=-0.0 size=N/A time=00:00:00.04 bitrate=N/A speed=44.3x
[Parsed_metadata_1 @ 0x7cac0d080] lavfi.signalstats.YAVG=128
`;

const LOGGED_OUTPUT = `
[Parsed_signalstats_0 @ 0x55f1] n:0 pts:0 pts_time:0 YMIN:16 YLOW:16 YAVG:97.4 YHIGH:235 YMAX:235
`;

describe('parseMeanLuma', () => {
  it('reads the metadata form current ffmpeg emits', () => {
    expect(parseMeanLuma(METADATA_OUTPUT)).toBe(128);
  });

  it('still reads the stderr form older ffmpeg logged', () => {
    expect(parseMeanLuma(LOGGED_OUTPUT)).toBe(97.4);
  });

  it('reads a black frame as zero rather than treating it as absent', () => {
    expect(parseMeanLuma('[Parsed_metadata_1 @ 0x1] lavfi.signalstats.YAVG=0')).toBe(0);
  });

  it('returns null when the filter produced no value at all', () => {
    // Exactly what `-vf signalstats` alone yields on ffmpeg 9: the command
    // succeeds and prints nothing measurable.
    expect(parseMeanLuma('frame=    1 fps=0.0 q=-0.0 Lsize=N/A time=00:00:00.04 speed=44.3x')).toBeNull();
  });

  it('returns null for empty output', () => {
    expect(parseMeanLuma('')).toBeNull();
  });

  it('prefers the metadata value when a build emits both', () => {
    expect(parseMeanLuma(`${LOGGED_OUTPUT}\n${METADATA_OUTPUT}`)).toBe(128);
  });

  it('is not fooled by another stat that ends in YAVG-like digits', () => {
    expect(parseMeanLuma('[Parsed_signalstats_0 @ 0x1] UAVG:120.5 VAVG:130.5')).toBeNull();
  });
});
