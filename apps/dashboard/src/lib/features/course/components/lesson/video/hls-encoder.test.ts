import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/services/api', () => ({
  classroomio: {}
}));

import { ALL_HLS_RUNGS, selectRungsForSource } from './hls-encoder';

function mockTrack(height: number) {
  return { displayHeight: height, displayWidth: Math.round(height * (16 / 9)) };
}

describe('selectRungsForSource', () => {
  it('returns 360p and 720p for HD sources under 100MB', () => {
    const rungs = selectRungsForSource(mockTrack(1080) as never, 720, 50 * 1024 * 1024);

    expect(rungs.map((rung) => rung.name)).toEqual(['p360', 'p720']);
  });

  it('returns only the highest rung for large HD sources', () => {
    const rungs = selectRungsForSource(mockTrack(1080) as never, 720, 195 * 1024 * 1024);

    expect(rungs).toEqual([ALL_HLS_RUNGS.find((rung) => rung.name === 'p720')]);
  });

  it('returns a single 360p rung for low-resolution sources', () => {
    const rungs = selectRungsForSource(mockTrack(480) as never, 720, 200 * 1024 * 1024);

    expect(rungs.map((rung) => rung.name)).toEqual(['p360']);
  });
});
