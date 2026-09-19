import { describe, expect, it } from 'vitest';
import { ZLessonCreate, ZLessonUpdate } from '@cio/utils/validation/lesson';
import { ZCourseImportDraftLesson } from '@cio/utils/validation/course-import';

const sampleVideo = {
  type: 'youtube' as const,
  link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  watchEnforced: true
};

describe('lesson video field (FIX-02)', () => {
  it('ZCourseImportDraftLesson accepts a videos array (this is the schema MCP and the public API structure endpoint both share)', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 0,
      videos: [sampleVideo]
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.videos).toEqual([sampleVideo]);
  });

  it('ZCourseImportDraftLesson still works without videos (backward compatible)', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 0
    });

    expect(result.success).toBe(true);
  });

  it('ZLessonCreate accepts videos (needed so new lessons created via course-import can carry video, not just updates)', () => {
    const result = ZLessonCreate.safeParse({
      title: 'Intro',
      courseId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
      videos: [sampleVideo]
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.videos).toEqual([sampleVideo]);
  });

  it('ZLessonUpdate still accepts videos (unchanged behavior)', () => {
    const result = ZLessonUpdate.safeParse({
      videos: [sampleVideo]
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.videos).toEqual([sampleVideo]);
  });

  it('rejects a video with an unsupported type', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 0,
      videos: [{ type: 'not-a-real-type', link: 'https://example.com/video' }]
    });

    expect(result.success).toBe(false);
  });

  it('accepts the full metadata shape used for oEmbed-derived video info', () => {
    const result = ZLessonUpdate.safeParse({
      videos: [
        {
          type: 'youtube',
          link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          metadata: {
            title: 'A video',
            duration: 212,
            thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg'
          }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('preserves HLS-derived metadata keys that are not in the known list, instead of silently stripping them', () => {
    const result = ZLessonUpdate.safeParse({
      videos: [
        {
          type: 'upload',
          link: 'https://example.com/video.mp4',
          metadata: {
            title: 'A video',
            hls: true,
            sourceWidth: 1920,
            sourceHeight: 1080,
            hlsRenditions: ['720p', '1080p'],
            hls1080Status: 'ready'
          }
        }
      ]
    });

    expect(result.success).toBe(true);
    const metadata = result.success ? result.data.videos?.[0]?.metadata : undefined;
    expect(metadata).toMatchObject({
      title: 'A video',
      hls: true,
      sourceWidth: 1920,
      sourceHeight: 1080,
      hlsRenditions: ['720p', '1080p'],
      hls1080Status: 'ready'
    });
  });
});
