import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/media-transcript', () => ({ listMediaTranscriptsByAssetIds: vi.fn() }));
vi.mock('@cio/db/queries/youtube-caption', () => ({ getActiveNegativeYoutubeCaption: vi.fn() }));
vi.mock('@cio/core/services/jobs/media-jobs', () => ({ startYoutubeCaptionsJob: vi.fn() }));
vi.mock('@cio/core/services/lesson/lesson', () => ({ getLesson: vi.fn() }));
vi.mock('@cio/core/services/youtube-captions/policy', () => ({
  CAPTION_FETCH_COST_UNITS: 6_000,
  canOrgFetchYoutubeCaptions: vi.fn(),
  isSelfHostedInstance: vi.fn(() => false)
}));
vi.mock('@cio/core/services/agent/usage', () => ({ getTokenBalance: vi.fn() }));

import { getLessonVideoTranscript } from '@cio/core/services/agent/lesson-transcript';
import { listMediaTranscriptsByAssetIds } from '@cio/db/queries/media-transcript';
import { getActiveNegativeYoutubeCaption } from '@cio/db/queries/youtube-caption';
import { startYoutubeCaptionsJob } from '@cio/core/services/jobs/media-jobs';
import { getLesson } from '@cio/core/services/lesson/lesson';
import { canOrgFetchYoutubeCaptions } from '@cio/core/services/youtube-captions/policy';
import { getTokenBalance } from '@cio/core/services/agent/usage';

const ORG = 'org-1';
const OPTIONS = { userId: 'user-1', courseId: 'course-1' };

const UPLOAD_VIDEO = { type: 'upload', assetId: 'asset-upload' };
const YOUTUBE_VIDEO = {
  type: 'youtube',
  assetId: 'asset-youtube',
  link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
};

function mockLesson(videos: unknown[]) {
  vi.mocked(getLesson).mockResolvedValue({ id: 'lesson-1', title: 'Lesson', videos } as never);
}

describe('getLessonVideoTranscript status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canOrgFetchYoutubeCaptions).mockResolvedValue(true);
    vi.mocked(getTokenBalance).mockResolvedValue({ remaining: 1_000_000 } as never);
    vi.mocked(getActiveNegativeYoutubeCaption).mockResolvedValue(null as never);
    vi.mocked(startYoutubeCaptionsJob).mockResolvedValue({} as never);
  });

  it('does not report ready when an upload has text but a YouTube video does not', async () => {
    mockLesson([UPLOAD_VIDEO, YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([
      { assetId: 'asset-upload', text: 'spoken words from the uploaded video' }
    ] as never);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('fetching');
    expect(result.hasTranscript).toBe(false);
    expect(result.transcript).toContain('spoken words');
  });

  it('reports ready only when every video has a transcript', async () => {
    mockLesson([UPLOAD_VIDEO, YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([
      { assetId: 'asset-upload', text: 'upload text' },
      { assetId: 'asset-youtube', text: 'youtube text' }
    ] as never);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('ready');
    expect(result.hasTranscript).toBe(true);
  });

  it('reports unavailable, not plan_gated, for a video already known to have no captions', async () => {
    mockLesson([YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([] as never);
    vi.mocked(getActiveNegativeYoutubeCaption).mockResolvedValue({ unavailableReason: 'no_captions' } as never);
    vi.mocked(canOrgFetchYoutubeCaptions).mockResolvedValue(false);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('unavailable');
    expect(startYoutubeCaptionsJob).not.toHaveBeenCalled();
  });

  it('never re-enqueues a video already known to have no captions', async () => {
    mockLesson([YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([] as never);
    vi.mocked(getActiveNegativeYoutubeCaption).mockResolvedValue({ unavailableReason: 'no_captions' } as never);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('unavailable');
    expect(startYoutubeCaptionsJob).not.toHaveBeenCalled();
  });

  it('enqueues and reports fetching for a video with no cached verdict', async () => {
    mockLesson([YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([] as never);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('fetching');
    expect(startYoutubeCaptionsJob).toHaveBeenCalledTimes(1);
  });

  it('reports plan_gated only when the video is actually fetchable', async () => {
    mockLesson([YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([] as never);
    vi.mocked(canOrgFetchYoutubeCaptions).mockResolvedValue(false);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('plan_gated');
    expect(startYoutubeCaptionsJob).not.toHaveBeenCalled();
  });

  it('reports token_limit_reached when credits are short', async () => {
    mockLesson([YOUTUBE_VIDEO]);
    vi.mocked(listMediaTranscriptsByAssetIds).mockResolvedValue([] as never);
    vi.mocked(getTokenBalance).mockResolvedValue({ remaining: 10 } as never);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('token_limit_reached');
    expect(startYoutubeCaptionsJob).not.toHaveBeenCalled();
  });

  it('reports no_videos for a lesson with nothing to transcribe', async () => {
    mockLesson([]);

    const result = await getLessonVideoTranscript('lesson-1', ORG, OPTIONS);

    expect(result.status).toBe('no_videos');
    expect(result.hasTranscript).toBe(false);
  });
});
