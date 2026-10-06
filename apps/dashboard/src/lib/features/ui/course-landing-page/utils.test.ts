import type { Review } from '$features/course/utils/types';
import { isEmptyReview, normalizeReview, resolveCourseNavHref } from './utils';

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    hide: false,
    name: '',
    avatar_url: '',
    rating: 1,
    created_at: 1,
    description: '',
    ...overrides
  } as Review;
}

describe('resolveCourseNavHref', () => {
  it('routes a fragment-only nav href back to the org home page', () => {
    expect(resolveCourseNavHref('#about-us')).toBe('/#about-us');
  });

  it('leaves an already-rooted path untouched', () => {
    expect(resolveCourseNavHref('/pricing')).toBe('/pricing');
  });

  it('leaves an external URL untouched', () => {
    expect(resolveCourseNavHref('https://example.com')).toBe('https://example.com');
  });
});

describe('isEmptyReview', () => {
  it('treats a freshly added review as empty', () => {
    expect(isEmptyReview(makeReview())).toBe(true);
  });

  it('treats a review with only whitespace as empty', () => {
    expect(isEmptyReview(makeReview({ name: '   ', description: '  ' }))).toBe(true);
  });

  it('treats a missing review as empty', () => {
    expect(isEmptyReview(undefined)).toBe(true);
    expect(isEmptyReview(null)).toBe(true);
  });

  it('keeps a review that has a name', () => {
    expect(isEmptyReview(makeReview({ name: 'Jane Doe' }))).toBe(false);
  });

  it('keeps a review that has a description', () => {
    expect(isEmptyReview(makeReview({ description: 'A great course.' }))).toBe(false);
  });

  it('keeps a review that only has an avatar', () => {
    expect(isEmptyReview(makeReview({ avatar_url: 'https://example.com/avatar.png' }))).toBe(false);
  });
});

describe('normalizeReview', () => {
  it('leaves a complete review untouched', () => {
    const review = makeReview({ name: 'Jane Doe', description: 'Great course', rating: 4 });

    expect(normalizeReview(review)).toEqual(review);
  });

  it('replaces a cleared rating with the default the form uses', () => {
    const review = normalizeReview(makeReview({ name: 'Jane Doe', rating: null as unknown as number }));

    expect(review.rating).toBe(1);
  });

  it('coerces a numeric rating stored as a string', () => {
    const review = normalizeReview(makeReview({ name: 'Jane Doe', rating: '4' as unknown as number }));

    expect(review.rating).toBe(4);
  });

  it('falls back to an empty string when a text field is not a string', () => {
    const review = normalizeReview(
      makeReview({
        name: null as unknown as string,
        description: undefined as unknown as string,
        avatar_url: 42 as unknown as string
      })
    );

    expect(review.name).toBe('');
    expect(review.description).toBe('');
    expect(review.avatar_url).toBe('');
  });

  it('coerces a non-boolean hide flag to false', () => {
    expect(normalizeReview(makeReview({ hide: undefined as unknown as boolean })).hide).toBe(false);
  });
});
