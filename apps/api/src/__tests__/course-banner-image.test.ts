import { describe, expect, it } from 'vitest';
import { ZCourseUpdateBase } from '@cio/utils/validation/course';
import { ZPublicApiUpdateCourse } from '@cio/utils/validation/public-api';

describe('bannerImage on course update (FIX-01)', () => {
  it('ZCourseUpdateBase accepts and preserves bannerImage', () => {
    const result = ZCourseUpdateBase.safeParse({
      title: 'Course',
      logo: 'https://example.com/logo.png',
      bannerImage: 'https://example.com/banner.png'
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.bannerImage).toBe('https://example.com/banner.png');
    expect(result.success && result.data.logo).toBe('https://example.com/logo.png');
  });

  it('ZCourseUpdateBase allows bannerImage independent of the deprecated logo', () => {
    const result = ZCourseUpdateBase.safeParse({
      bannerImage: 'https://example.com/banner-only.png'
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.bannerImage).toBe('https://example.com/banner-only.png');
    expect(result.success && result.data.logo).toBeUndefined();
  });

  it('ZCourseUpdateBase still accepts the deprecated logo field for backward compatibility', () => {
    const result = ZCourseUpdateBase.safeParse({
      logo: 'https://example.com/legacy-logo.png'
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.logo).toBe('https://example.com/legacy-logo.png');
  });

  it('ZPublicApiUpdateCourse (the public API schema) does not silently drop bannerImage', () => {
    const result = ZPublicApiUpdateCourse.safeParse({
      bannerImage: 'https://example.com/banner.png'
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.bannerImage).toBe('https://example.com/banner.png');
  });

  it('ZPublicApiUpdateCourse still omits tagIds', () => {
    const result = ZPublicApiUpdateCourse.safeParse({
      bannerImage: 'https://example.com/banner.png',
      tagIds: ['3f2504e0-4f89-11d3-9a0c-0305e82c3301']
    });

    expect(result.success).toBe(true);
    expect(result.success && 'tagIds' in result.data).toBe(false);
  });
});
