import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/lesson', () => ({
  getLessonById: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetsByStorageKeys: vi.fn()
}));

vi.mock('@cio/core/services/assets/assets', () => ({
  attachAssetService: vi.fn()
}));

vi.mock('@cio/core/services/lesson/lesson', () => ({
  updateLessonService: vi.fn()
}));

import { AppError, ErrorCodes } from '@cio/utils/errors';
import { getLessonById } from '@cio/db/queries/lesson';
import { getAssetsByStorageKeys } from '@cio/db/queries/assets';
import { attachAssetService } from '@cio/core/services/assets/assets';
import { updateLessonService } from '@cio/core/services/lesson/lesson';
import { attachUploadedVideoToLesson } from '@cio/core/services/agent/lesson-upload-video';

const input = {
  orgId: 'org-1',
  actorId: 'actor-1',
  courseId: 'course-1',
  lessonId: 'lesson-1',
  fileKey: 'videos/new.mp4',
  downloadUrl: 'https://storage.example.com/videos/new.mp4?sig=abc',
  fileName: 'new.mp4',
  fileType: 'video/mp4'
};

const storedVideo = {
  type: 'upload' as const,
  link: 'https://storage.example.com/videos/old.mp4',
  key: 'videos/old.mp4',
  assetId: 'asset-old'
};

function mockLesson(overrides: Record<string, unknown> = {}) {
  vi.mocked(getLessonById).mockResolvedValue({
    id: 'lesson-1',
    courseId: 'course-1',
    title: 'Intro',
    videos: [storedVideo],
    ...overrides
  } as unknown as Awaited<ReturnType<typeof getLessonById>>);
}

describe('attachUploadedVideoToLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(attachAssetService).mockResolvedValue(undefined as never);
    mockLesson();
    vi.mocked(getAssetsByStorageKeys).mockResolvedValue([{ id: 'asset-new', storageKey: input.fileKey }] as Awaited<
      ReturnType<typeof getAssetsByStorageKeys>
    >);
  });

  it('returns 404 for a lesson in another course', async () => {
    mockLesson({ courseId: 'another-course' });

    await expect(attachUploadedVideoToLesson(input)).rejects.toMatchObject({ statusCode: 404 });
    expect(updateLessonService).not.toHaveBeenCalled();
  });

  it('returns 404 when the lesson does not exist', async () => {
    vi.mocked(getLessonById).mockResolvedValue(null);

    await expect(attachUploadedVideoToLesson(input)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 403 for a file the organization does not own, without creating anything', async () => {
    vi.mocked(getAssetsByStorageKeys).mockResolvedValue([]);

    await expect(attachUploadedVideoToLesson(input)).rejects.toMatchObject({ statusCode: 403 });
    expect(getAssetsByStorageKeys).toHaveBeenCalledWith('org-1', [input.fileKey]);
    expect(attachAssetService).not.toHaveBeenCalled();
    expect(updateLessonService).not.toHaveBeenCalled();
  });

  it('appends the video to the raw stored videos and attaches the org asset', async () => {
    const result = await attachUploadedVideoToLesson(input);

    expect(attachAssetService).toHaveBeenCalledWith('org-1', 'asset-new', 'actor-1', {
      targetType: 'lesson',
      targetId: 'lesson-1',
      slotType: 'lesson_video',
      position: 1
    });
    expect(updateLessonService).toHaveBeenCalledWith('lesson-1', {
      videos: [storedVideo, expect.objectContaining({ type: 'upload', key: input.fileKey, assetId: 'asset-new' })]
    });
    expect(result).toEqual({
      lessonId: 'lesson-1',
      lessonTitle: 'Intro',
      assetId: 'asset-new',
      fileKey: input.fileKey,
      position: 1
    });
  });

  it('still adds the video when a previous attempt already linked the asset to the lesson', async () => {
    vi.mocked(attachAssetService).mockRejectedValueOnce(
      new AppError('Asset is already attached to this target', ErrorCodes.ASSET_ALREADY_ATTACHED, 409)
    );

    await attachUploadedVideoToLesson(input);

    expect(updateLessonService).toHaveBeenCalledWith('lesson-1', {
      videos: [storedVideo, expect.objectContaining({ key: input.fileKey })]
    });
  });

  it('returns the existing entry when the same file is attached again', async () => {
    const result = await attachUploadedVideoToLesson({ ...input, fileKey: storedVideo.key });

    expect(result).toMatchObject({ assetId: 'asset-old', position: 0 });
    expect(attachAssetService).not.toHaveBeenCalled();
    expect(updateLessonService).not.toHaveBeenCalled();
  });
});
