import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseParam,
  ZPublicApiListCourseCertificatesQuery,
  ZPublicApiUpdateCourseCertificate
} from '../src/validation/public-api';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

describe('ZPublicApiUpdateCourseCertificate', () => {
  it('rejects an empty body', () => {
    expect(ZPublicApiUpdateCourseCertificate.safeParse({}).success).toBe(false);
  });

  it('still rejects a body with only the course id once extended for an MCP tool', () => {
    const toolInput = ZPublicApiUpdateCourseCertificate.safeExtend({
      courseId: ZPublicApiCourseParam.shape.courseId
    });

    expect(toolInput.safeParse({ courseId: COURSE_ID }).success).toBe(false);
    expect(toolInput.safeParse({ courseId: COURSE_ID, isDownloadable: true }).success).toBe(true);
  });

  it('rejects an unknown template id', () => {
    expect(ZPublicApiUpdateCourseCertificate.safeParse({ design: { templateId: 'unknown' } }).success).toBe(false);
  });
});

describe('ZPublicApiListCourseCertificatesQuery', () => {
  it('defaults to page 1 and limit 20 and caps limit at 100', () => {
    expect(ZPublicApiListCourseCertificatesQuery.parse({})).toEqual({ page: 1, limit: 20 });
    expect(ZPublicApiListCourseCertificatesQuery.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('does not accept a role filter', () => {
    expect(ZPublicApiListCourseCertificatesQuery.parse({ roleId: '2' })).not.toHaveProperty('roleId');
  });
});
