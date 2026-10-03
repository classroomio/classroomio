import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAddCohortMembers,
  ZPublicApiAddCourseToCohort,
  ZPublicApiAssignStudentsToCohort,
  ZPublicApiCohortNewsfeedQuery,
  ZPublicApiCreateCohort,
  ZPublicApiCreateCohortGoal,
  ZPublicApiCreateCohortNewsfeed,
  ZPublicApiCreateCohortNewsfeedComment,
  ZPublicApiInviteStudentsToCohort,
  ZPublicApiSetCohortInviteLinkRevoked,
  ZPublicApiSetCohortReaction,
  ZPublicApiUpdateCohort,
  ZPublicApiUpdateCohortGoal,
  ZPublicApiUpdateCohortMember,
  ZPublicApiUpdateCohortNewsfeed
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiCreateCohort,
  ZPublicApiUpdateCohort,
  ZPublicApiAddCohortMembers,
  ZPublicApiUpdateCohortMember,
  ZPublicApiAddCourseToCohort,
  ZPublicApiCohortNewsfeedQuery,
  ZPublicApiCreateCohortNewsfeed,
  ZPublicApiUpdateCohortNewsfeed,
  ZPublicApiSetCohortReaction,
  ZPublicApiCreateCohortNewsfeedComment,
  ZPublicApiCreateCohortGoal,
  ZPublicApiUpdateCohortGoal,
  ZPublicApiInviteStudentsToCohort,
  ZPublicApiAssignStudentsToCohort,
  ZPublicApiSetCohortInviteLinkRevoked
};

describe('public API cohort request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('keeps goal create validation rules that are not visible in the JSON shape', () => {
    const base = { title: 'Goal', courseIds: ['11111111-1111-4111-8111-111111111111'] };

    expect(ZPublicApiCreateCohortGoal.safeParse({ ...base, type: 'n_of_m' }).success).toBe(false);
    expect(ZPublicApiCreateCohortGoal.safeParse({ ...base, type: 'n_of_m', requiredCount: 2 }).success).toBe(false);
    expect(ZPublicApiCreateCohortGoal.safeParse({ ...base, type: 'score' }).success).toBe(false);
    expect(ZPublicApiCreateCohortGoal.safeParse({ ...base, type: 'readiness', deadlineKind: 'absolute' }).success).toBe(
      false
    );
    expect(ZPublicApiCreateCohortGoal.safeParse({ ...base, type: 'complete_all', courseIds: [] }).success).toBe(false);
    expect(ZPublicApiCreateCohortGoal.safeParse({ ...base, type: 'complete_all' }).success).toBe(true);
  });

  it('rejects the old full-state reaction body', () => {
    expect(
      ZPublicApiSetCohortReaction.safeParse({ reaction: { clap: [], smile: [], thumbsup: [], thumbsdown: [] } }).success
    ).toBe(false);
    expect(ZPublicApiSetCohortReaction.safeParse({ reaction: null }).success).toBe(true);
  });
});
