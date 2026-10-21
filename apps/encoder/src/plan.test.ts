import { describe, expect, it } from 'vitest';

import {
  buildFfmpegArgs,
  buildMasterPlaylist,
  buildVarStreamMap,
  evenWidthFor,
  gopSize,
  outputDimensions,
  outputFps,
  scaleExpressionFor,
  selectRungs,
  type SourceInfo
} from './plan.js';

const source = (overrides: Partial<SourceInfo> = {}): SourceInfo => ({
  width: 1920,
  height: 1080,
  fps: 30,
  durationSeconds: 600,
  hasAudio: true,
  ...overrides
});

const portrait = (overrides: Partial<SourceInfo> = {}): SourceInfo =>
  source({ width: 1080, height: 1920, ...overrides });

describe('portrait sources', () => {
  it('sizes the ladder by the short side, not the long one', () => {
    expect(selectRungs(portrait()).map((rung) => rung.name)).toEqual(['p360', 'p720', 'p1080']);
    expect(selectRungs(portrait({ width: 720, height: 1280 })).map((r) => r.name)).toEqual(['p360', 'p720']);
  });

  it('gives the top rung the full short side rather than a 608-wide frame', () => {
    const [, , top] = selectRungs(portrait());
    expect(outputDimensions(top!, portrait())).toEqual({ width: 1080, height: 1920 });
  });

  it('scales the width so ffmpeg derives the height', () => {
    const [, , top] = selectRungs(portrait());
    expect(scaleExpressionFor(top!, portrait())).toBe('1080:-2');
  });

  it('keeps landscape scaling on the height', () => {
    const [, , top] = selectRungs(source());
    expect(scaleExpressionFor(top!, source())).toBe('-2:1080');
  });

  it('reports the real frame in the master playlist', () => {
    const playlist = buildMasterPlaylist({ rungs: selectRungs(portrait()), source: portrait() });

    expect(playlist).toContain('RESOLUTION=1080x1920');
    expect(playlist).toContain('RESOLUTION=720x1280');
    expect(playlist).toContain('RESOLUTION=360x640');
  });

  it('never upscales either dimension', () => {
    const info = portrait({ width: 720, height: 1280 });

    for (const rung of selectRungs(info)) {
      const { width, height } = outputDimensions(rung, info);
      expect(width).toBeLessThanOrEqual(info.width);
      expect(height).toBeLessThanOrEqual(info.height);
    }
  });

  it('treats a square source as landscape so one branch owns the tie', () => {
    const square = source({ width: 1080, height: 1080 });

    expect(scaleExpressionFor(selectRungs(square)[2]!, square)).toBe('-2:1080');
    expect(outputDimensions(selectRungs(square)[2]!, square)).toEqual({ width: 1080, height: 1080 });
  });
});

describe('selectRungs', () => {
  it('emits the full ladder for a 1080p source', () => {
    expect(selectRungs(source()).map((rung) => rung.name)).toEqual(['p360', 'p720', 'p1080']);
  });

  it('never upscales', () => {
    expect(selectRungs(source({ width: 1280, height: 720 })).map((r) => r.name)).toEqual(['p360', 'p720']);
    expect(selectRungs(source({ width: 854, height: 480 })).map((r) => r.name)).toEqual(['p360']);
  });

  it('returns nothing below the smallest rung, so the caller can fall back', () => {
    expect(selectRungs(source({ width: 426, height: 240 }))).toEqual([]);
  });

  it('does not drop to a single rung for a long source, unlike the browser encoder', () => {
    const rungs = selectRungs(source({ durationSeconds: 4 * 60 * 60 }));

    expect(rungs.length).toBe(3);
  });
});

describe('frame rate and keyframes', () => {
  it('caps output at 30fps', () => {
    expect(outputFps(source({ fps: 60 }))).toBe(30);
    expect(outputFps(source({ fps: 59.94 }))).toBe(30);
  });

  it('keeps a lower source rate', () => {
    expect(outputFps(source({ fps: 24 }))).toBe(24);
  });

  it('falls back to the cap when the source rate is unknown', () => {
    expect(outputFps(source({ fps: 0 }))).toBe(30);
  });

  it('aligns the keyframe interval to the segment length', () => {
    expect(gopSize(source({ fps: 30 }))).toBe(120);
    expect(gopSize(source({ fps: 24 }))).toBe(96);
  });
});

describe('buildFfmpegArgs', () => {
  const args = () =>
    buildFfmpegArgs({ inputPath: '/in.mp4', outputDir: '/out', rungs: selectRungs(source()), source: source() });

  it('decodes once and splits to every rung', () => {
    const filter = args()[args().indexOf('-filter_complex') + 1];

    expect(filter).toContain('[0:v]split=3');
    expect(filter).toContain('scale=-2:360');
    expect(filter).toContain('scale=-2:720');
    expect(filter).toContain('scale=-2:1080');
  });

  it('uses a VOD preset rather than a live one', () => {
    expect(args()).toContain('slow');
    expect(args()).not.toContain('veryfast');
  });

  it('caps each rung with its own maxrate alongside CRF', () => {
    const flat = args().join(' ');

    expect(flat).toContain('-maxrate:v:0 800k');
    expect(flat).toContain('-maxrate:v:1 2500k');
    expect(flat).toContain('-maxrate:v:2 5000k');
  });

  it('encodes audio once and shares it', () => {
    const flat = args().join(' ');

    expect(flat).toContain('-map 0:a:0');
    expect(flat.match(/-c:a aac/g)).toHaveLength(1);
  });

  it('omits audio mapping when the source is silent', () => {
    const silent = source({ hasAudio: false });
    const flat = buildFfmpegArgs({
      inputPath: '/in.mp4',
      outputDir: '/out',
      rungs: selectRungs(silent),
      source: silent
    }).join(' ');

    expect(flat).not.toContain('-map 0:a:0');
    expect(flat).not.toContain('aac');
  });

  it('does not ask ffmpeg to write the master playlist', () => {
    expect(args()).not.toContain('-master_pl_name');
  });
});

describe('buildVarStreamMap', () => {
  it('groups every rung against one shared audio rendition', () => {
    expect(buildVarStreamMap(selectRungs(source()), true)).toBe(
      'v:0,agroup:aud,name:p360 v:1,agroup:aud,name:p720 v:2,agroup:aud,name:p1080 a:0,agroup:aud,name:audio,default:yes'
    );
  });

  it('omits the audio group entirely for a silent source', () => {
    expect(buildVarStreamMap(selectRungs(source()), false)).toBe('v:0,name:p360 v:1,name:p720 v:2,name:p1080');
  });
});

describe('buildMasterPlaylist', () => {
  const master = (overrides: Partial<SourceInfo> = {}) => {
    const info = source(overrides);
    return buildMasterPlaylist({ rungs: selectRungs(info), source: info });
  };

  it('declares every variant with a resolution, bandwidth and codecs', () => {
    const playlist = master();

    expect(playlist.startsWith('#EXTM3U')).toBe(true);
    for (const rung of ['p360', 'p720', 'p1080']) {
      expect(playlist).toContain(`${rung}/playlist.m3u8`);
    }
    expect(playlist).toContain('RESOLUTION=640x360');
    expect(playlist).toContain('RESOLUTION=1280x720');
    expect(playlist).toContain('RESOLUTION=1920x1080');
    expect(playlist).toContain('CODECS="avc1.640028,mp4a.40.2"');
    expect(playlist).toContain('AVERAGE-BANDWIDTH=');
  });

  it('has no audio-only variant to strip', () => {
    const streamLines = master()
      .split('\n')
      .filter((line) => line.startsWith('#EXT-X-STREAM-INF'));

    expect(streamLines).toHaveLength(3);
    expect(streamLines.every((line) => line.includes('RESOLUTION='))).toBe(true);
  });

  it('declares the audio rendition once, as the default', () => {
    const media = master()
      .split('\n')
      .filter((line) => line.startsWith('#EXT-X-MEDIA'));

    expect(media).toHaveLength(1);
    expect(media[0]).toContain('DEFAULT=YES');
    expect(media[0]).toContain('URI="audio/playlist.m3u8"');
  });

  it('drops audio attributes for a silent source', () => {
    const playlist = master({ hasAudio: false });

    expect(playlist).not.toContain('#EXT-X-MEDIA');
    expect(playlist).not.toContain('AUDIO="aud"');
    expect(playlist).toContain('CODECS="avc1.640028"');
  });
});

describe('evenWidthFor', () => {
  it('preserves the aspect ratio', () => {
    expect(evenWidthFor(720, source())).toBe(1280);
    expect(evenWidthFor(360, source())).toBe(640);
  });

  it('rounds up to an even width, matching scale=-2', () => {
    // 1080x1920 portrait at 360 tall is 202.5 → 204, not 203.
    expect(evenWidthFor(360, source({ width: 1080, height: 1920 })) % 2).toBe(0);
  });
});
