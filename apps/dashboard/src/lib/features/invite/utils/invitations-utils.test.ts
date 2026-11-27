import { describe, expect, it } from 'vitest';

import { buildJoinedCourseLinks, courseLessonsHref, getJoinTarget } from './invitations-utils';
import type { PendingInvitationGroup } from './types';

function groupWith(overrides: Partial<PendingInvitationGroup> = {}): PendingInvitationGroup {
  return {
    organization: { id: 'org-1', name: 'Acme', siteName: 'acme', avatarUrl: null },
    orgInvite: {
      id: 'org-invite-1',
      email: 'ada@example.com',
      roleId: 3,
      roleLabel: 'Student',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-02-01T00:00:00.000Z'
    },
    courses: [],
    cohorts: [],
    ...overrides
  };
}

describe('getJoinTarget', () => {
  it('prefers the org invitation', () => {
    expect(
      getJoinTarget(
        groupWith({
          courses: [
            {
              inviteId: 'course-invite-1',
              courseId: 'course-1',
              title: 'Intro',
              description: null,
              slug: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              expiresAt: '2026-02-01T00:00:00.000Z'
            }
          ]
        })
      )
    ).toEqual({ kind: 'org', inviteId: 'org-invite-1' });
  });

  it('falls back to the first emailed course invitation', () => {
    expect(
      getJoinTarget(
        groupWith({
          orgInvite: null,
          courses: [
            {
              inviteId: 'course-invite-1',
              courseId: 'course-1',
              title: 'Intro',
              description: null,
              slug: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              expiresAt: '2026-02-01T00:00:00.000Z'
            }
          ]
        })
      )
    ).toEqual({ kind: 'course', inviteId: 'course-invite-1' });
  });

  it('returns null when nothing can be accepted', () => {
    expect(getJoinTarget(groupWith({ orgInvite: null }))).toBeNull();
  });
});

describe('buildJoinedCourseLinks', () => {
  it('merges the accepted course with fulfilled ones without duplicates', () => {
    const links = buildJoinedCourseLinks(
      groupWith({
        courses: [
          {
            inviteId: 'course-invite-1',
            courseId: 'course-1',
            title: 'Intro',
            description: null,
            slug: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            expiresAt: '2026-02-01T00:00:00.000Z'
          }
        ]
      }),
      'course-invite-1',
      {
        courses: [
          { id: 'course-1', title: 'Intro' },
          { id: 'course-2', title: 'Advanced' }
        ],
        cohorts: []
      }
    );

    expect(links).toEqual([
      { id: 'course-1', title: 'Intro' },
      { id: 'course-2', title: 'Advanced' }
    ]);
  });

  it('returns only fulfilled courses for an org-invite join', () => {
    const links = buildJoinedCourseLinks(groupWith(), 'org-invite-1', {
      courses: [{ id: 'course-9', title: 'Data' }],
      cohorts: []
    });

    expect(links).toEqual([{ id: 'course-9', title: 'Data' }]);
  });
});

describe('courseLessonsHref', () => {
  it('points at the course lessons page', () => {
    expect(courseLessonsHref('course-1')).toBe('/courses/course-1/lessons?next=true');
  });
});
