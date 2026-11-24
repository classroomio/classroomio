import { describe, expect, it } from 'vitest';

import {
  buildHeadingKey,
  courseBuildCardBodyKey,
  courseProgress,
  gateReasonKey,
  showsCourseBuildCard,
  isCourseBuildActive,
  planningStep,
  readyCourseIds,
  sourceLabel
} from './course-build-utils';
import type { CourseBuildCourse, CourseBuildSource, CourseBuildSummary } from './types';

function course(overrides: Partial<CourseBuildCourse>): CourseBuildCourse {
  return {
    id: 'c1',
    title: 'Work orders',
    status: 'PLANNED',
    sectionsWritten: 0,
    sectionsTotal: 6,
    courseId: null,
    ...overrides
  };
}

function build(overrides: Partial<CourseBuildSummary>): CourseBuildSummary {
  return {
    id: 'b1',
    status: 'RUNNING',
    stage: 'read',
    createdAt: '2026-11-20T00:00:00.000Z',
    finishedAt: null,
    gateReason: null,
    sources: [],
    courses: [],
    ...overrides
  };
}

describe('course build helpers', () => {
  it('counts the section being written, never past the last one', () => {
    expect(courseProgress(course({ status: 'WRITING', sectionsWritten: 2 }))).toEqual({
      key: 'course_build.course_status.writing',
      current: 3,
      total: 6
    });
    expect(courseProgress(course({ status: 'WRITING', sectionsWritten: 6 }))).toMatchObject({ current: 6 });
    expect(courseProgress(course({ status: 'EXPORTING' })).key).toBe('course_build.course_status.checking');
  });

  it('heads the build by where it stands', () => {
    expect(buildHeadingKey(build({ stage: 'read' }))).toBe('course_build.heading.reading');
    expect(buildHeadingKey(build({ stage: 'plan' }))).toBe('course_build.heading.planning');
    expect(buildHeadingKey(build({ stage: 'write', courses: [course({})] }))).toBe('course_build.heading.writing');
    expect(buildHeadingKey(build({ status: 'NOTHING_TO_BUILD' }))).toBe('course_build.heading.nothing');
    expect(buildHeadingKey(build({ status: 'COMPLETED' }))).toBe('course_build.heading.done');
  });

  it('explains each reason a build found nothing to build from', () => {
    expect(gateReasonKey('no-sources')).toBe('course_build.gate.no_sources');
    expect(gateReasonKey('all-sources-blocked')).toBe('course_build.gate.blocked');
    expect(gateReasonKey('login-only')).toBe('course_build.gate.login');
    expect(gateReasonKey('too-few-pages')).toBe('course_build.gate.too_few_pages');
    expect(gateReasonKey('too-few-words')).toBe('course_build.gate.too_few_words');
    expect(gateReasonKey(null)).toBe('course_build.nothing_body');
  });

  it('keeps the card up after a build ends with nothing, so the reason stays readable', () => {
    const ended = (status: CourseBuildSummary['status'], hoursAgo: number) =>
      build({
        status,
        finishedAt: new Date(Date.parse('2026-11-24T12:00:00.000Z') - hoursAgo * 3_600_000).toISOString()
      });
    const now = Date.parse('2026-11-24T12:00:00.000Z');

    expect(showsCourseBuildCard(build({ status: 'RUNNING' }), now)).toBe(true);
    expect(showsCourseBuildCard(ended('NOTHING_TO_BUILD', 1), now)).toBe(true);
    expect(showsCourseBuildCard(ended('FAILED', 1), now)).toBe(true);
    expect(showsCourseBuildCard(ended('NOTHING_TO_BUILD', 25), now)).toBe(false);
    expect(showsCourseBuildCard(ended('COMPLETED', 1), now)).toBe(false);
    expect(showsCourseBuildCard(null, now)).toBe(false);
  });

  it('gives the card a body that matches the state it is in', () => {
    expect(courseBuildCardBodyKey(build({ status: 'RUNNING' }))).toBe('course_build.card_body');
    expect(courseBuildCardBodyKey(build({ status: 'NOTHING_TO_BUILD', gateReason: 'login-only' }))).toBe(
      'course_build.gate.login'
    );
    expect(courseBuildCardBodyKey(build({ status: 'FAILED' }))).toBe('course_build.failed_body');
  });

  it('treats only pending and running builds as active', () => {
    expect(isCourseBuildActive(build({ status: 'PENDING' }))).toBe(true);
    expect(isCourseBuildActive(build({ status: 'COMPLETED' }))).toBe(false);
    expect(isCourseBuildActive(null)).toBe(false);
  });

  it('labels a source by host and path and lists ready courses', () => {
    expect(sourceLabel({ url: 'https://help.acme.com/' })).toBe('help.acme.com');
    expect(sourceLabel({ url: 'https://acme.com/docs/' })).toBe('acme.com/docs');
    expect([
      ...readyCourseIds(build({ courses: [course({ id: 'a', status: 'READY' }), course({ id: 'b' })] }))
    ]).toEqual(['a']);
  });

  it('shows the planning step once every source has settled and until the first course is listed', () => {
    const source = (status: string, pagesRead: number): CourseBuildSource => ({
      kind: 'help-center',
      url: `https://${status.toLowerCase()}.acme.com/`,
      status,
      pagesRead,
      outcome: null
    });
    const read = source('READ', 230);
    const failed = source('FAILED', 0);
    const reading = source('READING', 12);

    expect(planningStep(build({ sources: [read, reading] }))).toBeNull();
    expect(planningStep(build({ sources: [read, failed] }))).toEqual({
      key: 'course_build.planning_step.understand',
      pages: 230
    });
    expect(buildHeadingKey(build({ sources: [read, failed] }))).toBe('course_build.heading.planning');
    expect(planningStep(build({ stage: 'plan', sources: [read] }))).toEqual({
      key: 'course_build.planning_step.plan'
    });
    expect(planningStep(build({ stage: 'plan', sources: [read], courses: [course({})] }))).toBeNull();
    expect(planningStep(build({ status: 'FAILED', sources: [read] }))).toBeNull();
  });
});
