import { describe, expect, it } from 'vitest';
import { ZCourseUpdateBase } from '@cio/utils/validation/course';
import { ZPublicApiUpdateCourse } from '@cio/utils/validation/public-api';
import { resolveCourseBannerImage } from '@cio/utils/functions';

describe('bannerImage on course update', () => {
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

  it('allows bannerImage independent of the deprecated logo', () => {
    const result = ZCourseUpdateBase.safeParse({ bannerImage: 'https://example.com/banner-only.png' });

    expect(result.success).toBe(true);
    expect(result.success && result.data.bannerImage).toBe('https://example.com/banner-only.png');
    expect(result.success && result.data.logo).toBeUndefined();
  });

  it('still accepts the deprecated logo field for backward compatibility', () => {
    const result = ZCourseUpdateBase.safeParse({ logo: 'https://example.com/legacy-logo.png' });

    expect(result.success).toBe(true);
    expect(result.success && result.data.logo).toBe('https://example.com/legacy-logo.png');
  });

  it('does not silently drop bannerImage from the public API schema', () => {
    const result = ZPublicApiUpdateCourse.safeParse({ bannerImage: 'https://example.com/banner.png' });

    expect(result.success).toBe(true);
    expect(result.success && result.data.bannerImage).toBe('https://example.com/banner.png');
  });

  it('still omits tagIds from the public API schema', () => {
    const result = ZPublicApiUpdateCourse.safeParse({
      bannerImage: 'https://example.com/banner.png',
      tagIds: ['3f2504e0-4f89-11d3-9a0c-0305e82c3301']
    });

    expect(result.success).toBe(true);
    expect(result.success && 'tagIds' in result.data).toBe(false);
  });
});

describe('resolveCourseBannerImage', () => {
  it('prefers bannerImage when both columns are set', () => {
    const resolved = resolveCourseBannerImage({
      bannerImage: 'https://example.com/banner.png',
      logo: 'https://example.com/logo.png'
    });

    expect(resolved).toBe('https://example.com/banner.png');
  });

  it('falls back to the deprecated logo when bannerImage has not been backfilled', () => {
    const resolved = resolveCourseBannerImage({ bannerImage: null, logo: 'https://example.com/legacy.png' });

    expect(resolved).toBe('https://example.com/legacy.png');
  });

  it('treats an empty bannerImage as unset', () => {
    const resolved = resolveCourseBannerImage({ bannerImage: '', logo: 'https://example.com/legacy.png' });

    expect(resolved).toBe('https://example.com/legacy.png');
  });

  it('returns null when neither column has a value', () => {
    expect(resolveCourseBannerImage({ bannerImage: null, logo: null })).toBeNull();
    expect(resolveCourseBannerImage({})).toBeNull();
  });
});
