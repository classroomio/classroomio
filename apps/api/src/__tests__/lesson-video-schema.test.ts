import { describe, expect, it } from 'vitest';

import { ZAttachLessonVideo, ZLessonCreate, ZLessonUpdate, ZLessonVideoItem } from '@cio/utils/validation/lesson';
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

describe('ZAttachLessonVideo', () => {
  const valid = {
    fileKey: `${UPLOAD_ASSET_ID}/abc-intro.mp4`,
    downloadUrl: 'https://storage.example.com/abc-intro.mp4?signature=x',
    fileName: 'intro.mp4',
    fileType: 'video/mp4' as const,
    fileSize: 1024
  };

  it('accepts a well-formed payload', () => {
    expect(ZAttachLessonVideo.safeParse(valid).success).toBe(true);
  });

  it('rejects a fileType outside the allowed upload content types', () => {
    const result = ZAttachLessonVideo.safeParse({ ...valid, fileType: 'application/x-msdownload' });
    expect(result.success).toBe(false);
  });

  it.each(['../../etc/passwd', '/absolute/key.mp4', 'org/../other/key.mp4'])(
    'rejects traversal in fileKey: %s',
    (fileKey) => {
      expect(ZAttachLessonVideo.safeParse({ ...valid, fileKey }).success).toBe(false);
    }
  );

  it('rejects a non-URL downloadUrl', () => {
    expect(ZAttachLessonVideo.safeParse({ ...valid, downloadUrl: 'not-a-url' }).success).toBe(false);
  });
});
