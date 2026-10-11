import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAssignAudienceCoursesResponse,
  ZPublicApiAudienceMemberResponse,
  ZPublicApiCertificateSettingsResponse,
  ZPublicApiCourseDetailResponse,
  ZPublicApiCourseListItemResponse,
  ZPublicApiCourseResponse,
  ZPublicApiCourseStructureResponse,
  ZPublicApiCreateAudienceResponse,
  ZPublicApiCreateCourseResponse,
  ZPublicApiIssuedCertificateListItemResponse,
  ZPublicApiRemoveAudienceMemberResponse,
  ZPublicApiUpdateCourseEnvelope,
  ZPublicApiUpdateCourseStructureResponse
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const responseSchemas = {
  ZPublicApiAudienceMemberResponse,
  ZPublicApiCreateAudienceResponse,
  ZPublicApiAssignAudienceCoursesResponse,
  ZPublicApiRemoveAudienceMemberResponse,
  ZPublicApiCourseResponse,
  ZPublicApiCourseListItemResponse,
  ZPublicApiCourseDetailResponse,
  ZPublicApiCreateCourseResponse,
  ZPublicApiUpdateCourseEnvelope,
  ZPublicApiCourseStructureResponse,
  ZPublicApiUpdateCourseStructureResponse,
  ZPublicApiCertificateSettingsResponse,
  ZPublicApiIssuedCertificateListItemResponse
};

describe('public API audience and course response contract', () => {
  it.each(Object.entries(responseSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });
});
