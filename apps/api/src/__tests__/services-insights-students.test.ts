import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/insights/authorize', () => ({
  resolveAuthorizedScope: vi.fn()
}));

vi.mock('@api/services/insights/query', () => ({
  runInsightsQueryForScope: vi.fn()
}));

import { resolveAuthorizedScope } from '@api/services/insights/authorize';
import { runInsightsQueryForScope } from '@api/services/insights/query';
import { listInsightsStudentsForActor, listInsightsStudentsForScope } from '@api/services/insights/students';
import { AppError, ErrorCodes } from '@api/utils/errors';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const PROFILE_ID = '44444444-4444-4444-8444-444444444444';

const ACTOR = { profileId: PROFILE_ID, orgId: ORG_ID, orgRoles: { [ORG_ID]: 1 } };
const COHORT_SCOPE = { type: 'cohort' as const, id: COHORT_ID };
const AUTHORIZED = { orgId: ORG_ID, type: 'cohort' as const, id: COHORT_ID, courseIds: [COURSE_ID] };

function fullRow(overrides: Record<string, unknown> = {}) {
  return {
    student_id: 'student-1',
    student_label: 'Jane Doe',
    name__value: 'Jane Doe',
    email__value: 'jane@example.com',
    avatar_url__value: 'https://cdn/avatar.png',
    overall_progress_pct__value: 82,
    avg_score_pct__value: 91,
    courses_completed__value: 2,
    courses_total__value: 3,
    video_pct__value: 75,
    attendance_pct__value: 60,
    certificates__value: 1,
    last_login_at__value: '2026-11-01T10:00:00.000Z',
    is_overdue__value: false,
    status__value: 'on_track',
    status_rank__value: 2,
    now_at_title__value: 'Lesson 3: Variables',
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveAuthorizedScope).mockResolvedValue(AUTHORIZED);
  vi.mocked(runInsightsQueryForScope).mockResolvedValue({
    columns: [],
    rows: [fullRow()],
    total: 1,
    range: 'all',
    generatedAt: '2026-11-06T00:00:00.000Z',
    cached: false,
    refreshThrottled: false
  });
});

describe('listInsightsStudentsForActor', () => {
  it('maps the student table row into the camelCase student record', async () => {
    const result = await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE);

    expect(result.rows[0]).toEqual({
      id: 'student-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      avatarUrl: 'https://cdn/avatar.png',
      progressPct: 82,
      avgScorePct: 91,
      coursesCompleted: 2,
      coursesTotal: 3,
      videoPct: 75,
      attendancePct: 60,
      certificates: 1,
      lastLoginAt: '2026-11-01T10:00:00.000Z',
      isOverdue: false,
      status: 'on_track',
      nowAt: 'Lesson 3: Variables'
    });
    expect(result).toMatchObject({ page: 1, limit: 10, total: 1 });
  });

  it('falls back to the dimension label for the name and keeps unknown cells null', async () => {
    vi.mocked(runInsightsQueryForScope).mockResolvedValue({
      columns: [],
      rows: [
        fullRow({
          name__value: null,
          email__value: undefined,
          avatar_url__value: '',
          overall_progress_pct__value: 'not-a-number',
          certificates__value: null,
          status__value: 'weird-status',
          is_overdue__value: null
        })
      ],
      total: 1,
      range: 'all',
      generatedAt: '',
      cached: false,
      refreshThrottled: false
    });

    const result = await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE);

    expect(result.rows[0]).toEqual({
      id: 'student-1',
      name: 'Jane Doe',
      email: null,
      avatarUrl: null,
      progressPct: null,
      avgScorePct: 91,
      coursesCompleted: 2,
      coursesTotal: 3,
      videoPct: 75,
      attendancePct: 60,
      certificates: null,
      lastLoginAt: '2026-11-01T10:00:00.000Z',
      isOverdue: null,
      status: null,
      nowAt: 'Lesson 3: Variables'
    });
  });

  it('drops rows without a student id', async () => {
    vi.mocked(runInsightsQueryForScope).mockResolvedValue({
      columns: [],
      rows: [fullRow({ student_id: null }), fullRow({ student_id: 'student-2', email__value: 'two@example.com' })],
      total: 2,
      range: 'all',
      generatedAt: '',
      cached: false,
      refreshThrottled: false
    });

    const result = await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE);

    expect(result.rows.map((row) => row.id)).toEqual(['student-2']);
    expect(result.total).toBe(2);
  });

  it('pages through the shared students spec, clamped to the page cap', async () => {
    await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE, { page: 3, limit: 50 });

    const request = vi.mocked(runInsightsQueryForScope).mock.calls[0][1];
    expect(request.spec.page).toBe(3);
    expect(request.spec.limit).toBe(50);

    await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE, { page: 0, limit: 50000 });

    const clamped = vi.mocked(runInsightsQueryForScope).mock.calls[1][1];
    expect(clamped.spec.page).toBe(1);
    expect(clamped.spec.limit).toBe(1000);
  });

  it('sends status, overdue, search and course filters through the shared spec', async () => {
    await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE, {
      status: 'lagging',
      isOverdue: true,
      search: 'jane',
      courseId: COURSE_ID,
      sort: 'progress',
      dir: 'desc'
    });

    const spec = vi.mocked(runInsightsQueryForScope).mock.calls[0][1].spec;
    expect(spec.filters).toEqual([
      { field: 'status', op: 'eq', value: 'lagging' },
      { field: 'is_overdue', op: 'is_true' },
      { field: 'course', op: 'eq', value: COURSE_ID }
    ]);
    expect(spec.search).toBe('jane');
    expect(spec.sort).toEqual([{ field: 'overall_progress_pct__value', dir: 'desc' }]);
  });

  it('queries the authorized scope with the actor profile for the refresh claim', async () => {
    await listInsightsStudentsForActor(ACTOR, COHORT_SCOPE);

    expect(resolveAuthorizedScope).toHaveBeenCalledTimes(1);
    const call = vi.mocked(runInsightsQueryForScope).mock.calls[0];
    expect(call[0]).toEqual(AUTHORIZED);
    expect(call[1].scope).toEqual({ type: 'cohort', id: COHORT_ID });
    expect(call[2]).toEqual({ profileId: PROFILE_ID });
  });

  it('keeps authorization failures raw and skips the query', async () => {
    vi.mocked(resolveAuthorizedScope).mockRejectedValue(
      new AppError('You do not have access to these analytics', ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, 403)
    );

    await expect(listInsightsStudentsForActor(ACTOR, COHORT_SCOPE)).rejects.toMatchObject({
      code: ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN,
      statusCode: 403
    });
    expect(runInsightsQueryForScope).not.toHaveBeenCalled();
  });

  it('lists inside an already-authorized scope without authorizing again', async () => {
    const result = await listInsightsStudentsForScope(AUTHORIZED, { limit: 2 });

    expect(resolveAuthorizedScope).not.toHaveBeenCalled();
    expect(result.limit).toBe(2);
    expect(vi.mocked(runInsightsQueryForScope).mock.calls[0][2]).toEqual({ profileId: undefined });
  });
});
