import assert from 'node:assert/strict';
import test from 'node:test';

import type { FfprobeData } from '../../utils/ffmpeg';
import {
  buildHlsArgs,
  decideHlsPlan,
  maxKeyframeGap,
  readSourceInfo,
  remuxBlocker,
  stripAudioOnlyVariants,
  transcodeTimeoutMs,
  validateMasterPlaylist,
  type HlsSourceInfo
} from './hls-encode-plan';

const source = (overrides: Partial<HlsSourceInfo> = {}): HlsSourceInfo => ({
  width: 1280,
  height: 720,
  durationSeconds: 60,
  videoCodec: 'h264',
  audioCodec: 'aac',
  pixFmt: 'yuv420p',
  rotated: false,
  ...overrides
});

const regularKeyframes = Array.from({ length: 15 }, (_, i) => i * 4);

test('readSourceInfo reads codecs, size and duration', () => {
  const probe: FfprobeData = {
    format: { duration: '61.5' },
    streams: [
      { codec_type: 'video', codec_name: 'h264', width: 1920, height: 1080, pix_fmt: 'yuv420p' },
      { codec_type: 'audio', codec_name: 'aac' }
    ]
  };

  assert.deepEqual(readSourceInfo(probe), {
    width: 1920,
    height: 1080,
    durationSeconds: 61.5,
    videoCodec: 'h264',
    audioCodec: 'aac',
    pixFmt: 'yuv420p',
    rotated: false
  });
});

test('readSourceInfo flags rotation from side data and from the rotate tag', () => {
  const base = { codec_type: 'video' as const, codec_name: 'h264', width: 1080, height: 1920, pix_fmt: 'yuv420p' };

  assert.equal(
    readSourceInfo({ format: {}, streams: [{ ...base, side_data_list: [{ rotation: -90 }] }] })?.rotated,
    true
  );
  assert.equal(readSourceInfo({ format: {}, streams: [{ ...base, tags: { rotate: '90' } }] })?.rotated, true);
  assert.equal(readSourceInfo({ format: {}, streams: [base] })?.rotated, false);
});

test('readSourceInfo returns null without a video stream', () => {
  assert.equal(readSourceInfo({ format: {}, streams: [{ codec_type: 'audio', codec_name: 'aac' }] }), null);
});

test('readSourceInfo reports no audio as null', () => {
  const info = readSourceInfo({
    format: { duration: '10' },
    streams: [{ codec_type: 'video', codec_name: 'h264', width: 640, height: 360, pix_fmt: 'yuv420p' }]
  });

  assert.equal(info?.audioCodec, null);
});

test('maxKeyframeGap covers the start, the middle and the tail', () => {
  assert.equal(maxKeyframeGap([0, 4, 8], 12), 4);
  assert.equal(maxKeyframeGap([5, 9], 12), 5);
  assert.equal(maxKeyframeGap([0, 2, 4], 30), 26);
  assert.equal(maxKeyframeGap([], 30), Number.POSITIVE_INFINITY);
});

test('h264/aac with regular keyframes is remuxed', () => {
  const plan = decideHlsPlan(source(), regularKeyframes);

  assert.equal(plan.mode, 'remux');
  assert.equal(plan.rung, 'p720');
});

test('a remuxed video above 720p gets the neutral "source" folder, never p1080', () => {
  const plan = decideHlsPlan(source({ width: 1920, height: 1080 }), regularKeyframes);

  assert.equal(plan.mode, 'remux');
  assert.equal(plan.rung, 'source');
  assert.equal(plan.outputHeight, 1080);
});

test('a remuxed video without audio is allowed', () => {
  assert.equal(decideHlsPlan(source({ audioCodec: null }), regularKeyframes).mode, 'remux');
});

test('anything the streams cannot carry into MPEG-TS untouched is transcoded', () => {
  assert.equal(decideHlsPlan(source({ videoCodec: 'hevc' }), regularKeyframes).mode, 'transcode');
  assert.equal(decideHlsPlan(source({ pixFmt: 'yuv420p10le' }), regularKeyframes).mode, 'transcode');
  assert.equal(decideHlsPlan(source({ audioCodec: 'opus' }), regularKeyframes).mode, 'transcode');
  assert.equal(decideHlsPlan(source({ rotated: true }), regularKeyframes).mode, 'transcode');
});

test('keyframes too far apart force a transcode', () => {
  assert.equal(decideHlsPlan(source(), [0, 30, 60]).mode, 'transcode');
  assert.equal(decideHlsPlan(source(), []).mode, 'transcode');
});

test('transcode is capped at 720p, never upscaled, and always an even height', () => {
  assert.equal(decideHlsPlan(source({ videoCodec: 'hevc', width: 3840, height: 2160 }), []).outputHeight, 720);
  assert.equal(decideHlsPlan(source({ videoCodec: 'hevc', width: 640, height: 360 }), []).outputHeight, 360);
  assert.equal(decideHlsPlan(source({ videoCodec: 'hevc', width: 854, height: 481 }), []).outputHeight, 480);
});

test('remuxBlocker is null only when the streams can be copied', () => {
  assert.equal(remuxBlocker(source()), null);
  assert.match(remuxBlocker(source({ videoCodec: 'vp9' })) ?? '', /vp9/);
});

test('remux args copy both streams and write the expected layout', () => {
  const plan = decideHlsPlan(source(), regularKeyframes);
  const args = buildHlsArgs({ inputPath: '/in.mp4', outDir: '/tmp/out', plan, hasAudio: true });

  assert.deepEqual(args.slice(args.indexOf('-c:v'), args.indexOf('-c:v') + 2), ['-c:v', 'copy']);
  assert.deepEqual(args.slice(args.indexOf('-c:a'), args.indexOf('-c:a') + 2), ['-c:a', 'copy']);
  assert.equal(args.includes('libx264'), false);
  assert.equal(args[args.indexOf('-var_stream_map') + 1], 'v:0,agroup:audio,name:p720 a:0,agroup:audio,name:audio');
  assert.equal(args[args.indexOf('-hls_segment_filename') + 1], '/tmp/out/%v/seg-%05d.ts');
  assert.equal(args[args.indexOf('-master_pl_name') + 1], 'master.m3u8');
  assert.equal(args[args.length - 1], '/tmp/out/%v/playlist.m3u8');
  assert.equal(args[args.indexOf('-hls_time') + 1], '4');
});

test('transcode args encode one rung with keyframes every segment', () => {
  const plan = decideHlsPlan(source({ videoCodec: 'hevc', width: 1920, height: 1080 }), []);
  const args = buildHlsArgs({ inputPath: '/in.mkv', outDir: '/tmp/out', plan, hasAudio: true });

  assert.equal(args[args.indexOf('-c:v') + 1], 'libx264');
  assert.equal(args[args.indexOf('-vf') + 1], 'scale=-2:720');
  assert.equal(args[args.indexOf('-pix_fmt') + 1], 'yuv420p');
  assert.equal(args[args.indexOf('-force_key_frames') + 1], 'expr:gte(t,n_forced*4)');
  assert.equal(args[args.indexOf('-c:a') + 1], 'aac');
  assert.equal(args[args.indexOf('-var_stream_map') + 1], 'v:0,agroup:audio,name:p720 a:0,agroup:audio,name:audio');
});

test('a source without audio maps and names only the video variant', () => {
  const plan = decideHlsPlan(source({ audioCodec: null }), regularKeyframes);
  const args = buildHlsArgs({ inputPath: '/in.mp4', outDir: '/tmp/out', plan, hasAudio: false });

  assert.equal(args.includes('0:a:0'), false);
  assert.equal(args.includes('-c:a'), false);
  assert.equal(args[args.indexOf('-var_stream_map') + 1], 'v:0,name:p720');
});

test('Windows backslashes in the output dir are normalised for ffmpeg', () => {
  const plan = decideHlsPlan(source(), regularKeyframes);
  const args = buildHlsArgs({ inputPath: 'C:\\in.mp4', outDir: 'C:\\Temp\\cio-jobs\\out', plan, hasAudio: true });

  assert.equal(args[args.indexOf('-hls_segment_filename') + 1], 'C:/Temp/cio-jobs/out/%v/seg-%05d.ts');
  assert.equal(args[args.length - 1], 'C:/Temp/cio-jobs/out/%v/playlist.m3u8');
});

test('validateMasterPlaylist accepts a usable master and rejects broken ones', () => {
  const good = [
    '#EXTM3U',
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="audio",DEFAULT=YES,URI="audio/playlist.m3u8"',
    '#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2",AUDIO="audio"',
    'p720/playlist.m3u8'
  ].join('\n');

  assert.equal(validateMasterPlaylist(good), null);
  assert.match(validateMasterPlaylist('nope') ?? '', /#EXTM3U/);
  assert.match(validateMasterPlaylist('#EXTM3U\n') ?? '', /no #EXT-X-STREAM-INF/);
  assert.match(validateMasterPlaylist('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nx.m3u8') ?? '', /RESOLUTION/);
  assert.match(validateMasterPlaylist('#EXTM3U\n#EXT-X-STREAM-INF:RESOLUTION=1x1\nx.m3u8') ?? '', /BANDWIDTH/);
});

test('stripAudioOnlyVariants drops the audio-only stream entry ffmpeg adds and keeps the video one', () => {
  const ffmpegMaster = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="group_audio",NAME="audio_1",DEFAULT=YES,URI="audio/playlist.m3u8"',
    '#EXT-X-STREAM-INF:BANDWIDTH=2890800,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2",AUDIO="group_audio"',
    'p720/playlist.m3u8',
    '',
    '#EXT-X-STREAM-INF:BANDWIDTH=140800,CODECS="mp4a.40.2",AUDIO="group_audio"',
    'audio/playlist.m3u8',
    ''
  ].join('\n');

  assert.match(validateMasterPlaylist(ffmpegMaster) ?? '', /RESOLUTION/);

  const cleaned = stripAudioOnlyVariants(ffmpegMaster);

  assert.equal(validateMasterPlaylist(cleaned), null);
  assert.equal(cleaned.includes('URI="audio/playlist.m3u8"'), true);
  assert.equal(cleaned.split('\n').filter((line) => line === 'audio/playlist.m3u8').length, 0);
  assert.equal(cleaned.includes('p720/playlist.m3u8'), true);
  assert.equal(cleaned.endsWith('\n'), true);
});

test('stripAudioOnlyVariants leaves a video-only master unchanged', () => {
  const master =
    '#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-STREAM-INF:BANDWIDTH=135814,RESOLUTION=1280x720\np720/playlist.m3u8\n';

  assert.equal(stripAudioOnlyVariants(master), master);
});

test('transcodeTimeoutMs is 3x the duration with a 10 minute floor', () => {
  assert.equal(transcodeTimeoutMs(60), 10 * 60 * 1000);
  assert.equal(transcodeTimeoutMs(3600), 3 * 3600 * 1000);
});
