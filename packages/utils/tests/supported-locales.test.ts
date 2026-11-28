import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { EMAIL_LOCALES } from '../src/email';
import { ZUpdateProfile } from '../src/validation/account/account';
import { BLOCK_LOCALES, ZBlockLocale } from '../src/validation/block/block';
import { ZCourseImportDraftLessonLanguage } from '../src/validation/course-import/course-import';
import { ZLessonLanguageCreate, ZLessonLanguageGetByLocaleParam } from '../src/validation/lesson/language';
import { ONBOARDING_LOCALES } from '../src/validation/onboarding/onboarding';
import { ZUpdateOrganization } from '../src/validation/organization/organization';
import { ZPublicApiMemberProfileFields } from '../src/validation/public-api/audience';
import {
  ZPublicApiCourseLessonHistoryQuery,
  ZPublicApiCourseLessonTranslationsQuery
} from '../src/validation/public-api/course-lesson-translation';

const courseId = '00000000-0000-4000-8000-000000000001';
const lessonId = '00000000-0000-4000-8000-000000000002';

const localeInputs: Record<string, (locale: string) => z.ZodSafeParseResult<unknown>> = {
  profile: (locale) => ZUpdateProfile.safeParse({ locale }),
  organizationLanguage: (locale) => ZUpdateOrganization.safeParse({ settings: { language: { locale } } }),
  lessonLanguageParam: (locale) => ZLessonLanguageGetByLocaleParam.safeParse({ courseId, lessonId, locale }),
  lessonLanguageCreate: (locale) => ZLessonLanguageCreate.safeParse({ locale }),
  blockLocale: (locale) => ZBlockLocale.safeParse(locale),
  courseImportLessonLanguage: (locale) =>
    ZCourseImportDraftLessonLanguage.safeParse({ lessonExternalId: 'lesson-1', locale, content: '<p>Hi</p>' }),
  publicApiMemberProfile: (locale) => z.object(ZPublicApiMemberProfileFields).safeParse({ locale }),
  publicApiLessonTranslations: (locale) => ZPublicApiCourseLessonTranslationsQuery.safeParse({ locale }),
  publicApiLessonHistory: (locale) => ZPublicApiCourseLessonHistoryQuery.safeParse({ locale })
};

describe('supported locales', () => {
  it('lists the same locales for blocks, onboarding and email', () => {
    expect([...BLOCK_LOCALES]).toEqual([...EMAIL_LOCALES]);
    expect([...ONBOARDING_LOCALES]).toEqual([...EMAIL_LOCALES]);
  });

  it('includes Japanese', () => {
    expect(EMAIL_LOCALES).toContain('ja');
  });

  it.each(Object.entries(localeInputs))('%s accepts every supported locale', (_, parse) => {
    for (const locale of EMAIL_LOCALES) {
      expect(parse(locale).success, locale).toBe(true);
    }
  });

  it.each(Object.entries(localeInputs))('%s rejects an unsupported locale', (_, parse) => {
    expect(parse('xx').success).toBe(false);
  });
});
