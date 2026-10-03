import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import { ZCertificationSettings } from '../src/validation/course/course';
import {
  PUBLIC_API_CERTIFICATE_FIELDS,
  ZPublicApiCertificateDesign,
  ZPublicApiCourseCertificateMemberParam,
  ZPublicApiCourseParam,
  ZPublicApiDownloadCourseCertificateQuery,
  ZPublicApiListCourseCertificatesQuery,
  ZPublicApiUpdateCourseCertificate
} from '../src/validation/public-api';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

const fullDesign = {
  templateId: 'noir' as const,
  accentColor: '#112233',
  subtitle: 'With distinction',
  descriptionOverride: 'For finishing the course',
  signatories: [
    { name: 'A', role: 'Dean', enabled: true, signatureUrl: 'https://example.com/a.png' },
    { name: 'B', role: 'Tutor', enabled: false }
  ],
  idFormat: 'CIO-{year}-{seq}'
};

const fullPayload = {
  isDownloadable: true,
  theme: 'noir',
  design: fullDesign,
  deadline: '2026-12-31T23:59:59Z',
  threshold: 80,
  requiredExerciseId: COURSE_ID,
  exerciseMinScorePercent: 70,
  emailMessage: 'Well done'
};

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

  it.each(['tomorrow', 'not-a-date', '2026-12-31', '2026-12-31T23:59:59', '2026-13-01T00:00:00Z', '', '31/12/2026'])(
    'rejects the deadline %j',
    (deadline) => {
      expect(ZPublicApiUpdateCourseCertificate.safeParse({ deadline }).success).toBe(false);
    }
  );

  it.each(['2026-12-31T23:59:59Z', '2026-12-31T23:59:59.000Z', '2026-12-31T23:59:59+01:00'])(
    'accepts the ISO 8601 deadline %j',
    (deadline) => {
      expect(ZPublicApiUpdateCourseCertificate.parse({ deadline })).toEqual({ deadline });
    }
  );

  it('accepts null to clear each nullable field', () => {
    const cleared = { deadline: null, requiredExerciseId: null, exerciseMinScorePercent: null, emailMessage: null };

    expect(ZPublicApiUpdateCourseCertificate.parse(cleared)).toEqual(cleared);
  });

  it('rejects null for fields that cannot be cleared', () => {
    for (const field of ['isDownloadable', 'theme', 'design', 'threshold']) {
      expect(ZPublicApiUpdateCourseCertificate.safeParse({ [field]: null }).success).toBe(false);
    }
  });

  it('rejects a requiredExerciseId that is not a uuid and scores out of range', () => {
    expect(ZPublicApiUpdateCourseCertificate.safeParse({ requiredExerciseId: 'exercise-1' }).success).toBe(false);
    expect(ZPublicApiUpdateCourseCertificate.safeParse({ threshold: 101 }).success).toBe(false);
    expect(ZPublicApiUpdateCourseCertificate.safeParse({ exerciseMinScorePercent: -1 }).success).toBe(false);
  });
});

describe('public certificate contract', () => {
  it('exposes exactly the documented settings fields', () => {
    expect([...PUBLIC_API_CERTIFICATE_FIELDS].sort()).toEqual(
      [
        'deadline',
        'design',
        'emailMessage',
        'exerciseMinScorePercent',
        'isDownloadable',
        'requiredExerciseId',
        'theme',
        'threshold'
      ].sort()
    );
  });

  it('exposes exactly the documented design fields', () => {
    expect(Object.keys(ZPublicApiCertificateDesign.shape).sort()).toEqual(
      ['accentColor', 'descriptionOverride', 'idFormat', 'signatories', 'subtitle', 'templateId'].sort()
    );
  });

  it('drops fields that are not part of the public contract', () => {
    expect(ZPublicApiUpdateCourseCertificate.parse({ isDownloadable: true, internalOnly: 'x' })).toEqual({
      isDownloadable: true
    });
  });

  it.each([
    ['ZPublicApiUpdateCourseCertificate', ZPublicApiUpdateCourseCertificate],
    ['ZPublicApiListCourseCertificatesQuery', ZPublicApiListCourseCertificatesQuery],
    ['ZPublicApiCourseCertificateMemberParam', ZPublicApiCourseCertificateMemberParam],
    ['ZPublicApiDownloadCourseCertificateQuery', ZPublicApiDownloadCourseCertificateQuery]
  ])('keeps the %s request contract stable', (_name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input' })).toMatchSnapshot();
  });

  it('only produces values the stored dashboard schema also accepts', () => {
    const parsed = ZPublicApiUpdateCourseCertificate.parse(fullPayload);

    expect(ZCertificationSettings.parse(parsed)).toEqual(parsed);
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

describe('certificate download input', () => {
  it('defaults to pdf and accepts png only as the other format', () => {
    expect(ZPublicApiDownloadCourseCertificateQuery.parse({})).toEqual({ format: 'pdf' });
    expect(ZPublicApiDownloadCourseCertificateQuery.parse({ format: 'png' })).toEqual({ format: 'png' });
    expect(ZPublicApiDownloadCourseCertificateQuery.safeParse({ format: 'jpg' }).success).toBe(false);
  });

  it('requires uuid course and member ids', () => {
    expect(ZPublicApiCourseCertificateMemberParam.safeParse({ courseId: COURSE_ID, memberId: 'm-1' }).success).toBe(
      false
    );
    expect(ZPublicApiCourseCertificateMemberParam.safeParse({ courseId: COURSE_ID, memberId: COURSE_ID }).success).toBe(
      true
    );
  });
});
