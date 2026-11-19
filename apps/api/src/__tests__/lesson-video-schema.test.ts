import { describe, expect, it } from 'vitest';

import { ZLessonCreate, ZLessonUpdate, ZLessonVideoItem } from '@cio/utils/validation/lesson';
import { ZCourseImportDraftLesson } from '@cio/utils/validation/course-import';

const UPLOAD_ASSET_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

describe('ZLessonVideoItem', () => {
  it('accepts a YouTube embed', () => {
    const result = ZLessonVideoItem.safeParse({ type: 'youtube', link: 'https://youtube.com/watch?v=abc' });
    expect(result.success).toBe(true);
  });

  it('accepts an uploaded video served through the HLS proxy', () => {
    const result = ZLessonVideoItem.safeParse({
      type: 'upload',
      link: `/hls/${UPLOAD_ASSET_ID}/master.m3u8`,
      assetId: UPLOAD_ASSET_ID
    });
    expect(result.success).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html;base64,PHN2Zz4=', 'vbscript:msgbox(1)'])(
    'rejects the %s scheme',
    (link) => {
      expect(ZLessonVideoItem.safeParse({ type: 'generic', link }).success).toBe(false);
    }
  );

  it('preserves application-generated metadata it does not declare', () => {
    const result = ZLessonVideoItem.safeParse({
      type: 'upload',
      link: `/hls/${UPLOAD_ASSET_ID}/master.m3u8`,
      assetId: UPLOAD_ASSET_ID,
      metadata: { hls: true, hlsRenditions: ['p360', 'p720'], hls1080Status: 'ready', sourceHeight: 1080 }
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.metadata).toMatchObject({
      hls: true,
      hlsRenditions: ['p360', 'p720'],
      hls1080Status: 'ready',
      sourceHeight: 1080
    });
  });

  it('rejects a non-numeric duration', () => {
    const result = ZLessonVideoItem.safeParse({
      type: 'upload',
      link: '/hls/x/master.m3u8',
      assetId: UPLOAD_ASSET_ID,
      metadata: { duration: '120' }
    });
    expect(result.success).toBe(false);
  });
});

describe('lesson schemas carry videos', () => {
  it('accepts videos on create', () => {
    const result = ZLessonCreate.safeParse({
      title: 'Intro',
      courseId: 'course-1',
      order: 1,
      videos: [{ type: 'youtube', link: 'https://youtube.com/watch?v=abc' }]
    });
    expect(result.success).toBe(true);
  });

  it('accepts videos on update', () => {
    const result = ZLessonUpdate.safeParse({
      videos: [{ type: 'youtube', link: 'https://youtube.com/watch?v=abc' }]
    });
    expect(result.success).toBe(true);
  });

  it('accepts videos on a course-import draft lesson', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 1,
      videos: [{ type: 'youtube', link: 'https://youtube.com/watch?v=abc' }]
    });
    expect(result.success).toBe(true);
  });

  it('rejects a disallowed scheme through the draft lesson', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 1,
      videos: [{ type: 'generic', link: 'javascript:alert(1)' }]
    });
    expect(result.success).toBe(false);
  });
});

describe('draft seeding round-trips lesson videos', () => {
  it('accepts the shape the snapshot builder emits for a seeded lesson', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 1,
      videos: [
        { type: 'youtube', link: 'https://youtube.com/watch?v=abc' },
        {
          type: 'upload',
          link: `/hls/${UPLOAD_ASSET_ID}/master.m3u8`,
          assetId: UPLOAD_ASSET_ID,
          metadata: { hls: true, hlsRenditions: ['p360', 'p720'] }
        }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.videos).toHaveLength(2);
  });

  it('rejects a stored video the snapshot builder must drop rather than carry', () => {
    expect(ZLessonVideoItem.safeParse({ type: 'generic', link: 'javascript:alert(1)' }).success).toBe(false);
    expect(ZLessonVideoItem.safeParse({ type: 'not-a-provider', link: 'https://example.com' }).success).toBe(false);
    expect(ZLessonVideoItem.safeParse({ link: 'https://example.com' }).success).toBe(false);
  });
});

describe('legacy upload entries stay readable', () => {
  it('accepts an upload entry that predates assetId, so an ordinary save is not blocked', () => {
    const result = ZLessonVideoItem.safeParse({
      type: 'upload',
      link: 'https://storage.example.com/abc-intro.mp4?signature=x',
      key: 'abc-intro.mp4'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a legacy upload entry through a draft lesson, so seeding does not drop it', () => {
    const result = ZCourseImportDraftLesson.safeParse({
      externalId: 'lesson-1',
      sectionExternalId: 'section-1',
      title: 'Intro',
      order: 1,
      videos: [{ type: 'upload', link: 'https://storage.example.com/abc.mp4', key: 'abc.mp4' }]
    });

    expect(result.success).toBe(true);
  });
});
