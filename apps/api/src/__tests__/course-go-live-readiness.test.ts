import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentType } from '@cio/utils/constants';
import { getCourseById } from '@cio/db/queries/course';
import { getCourseContentItems, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationById } from '@cio/db/queries/organization';
import { updateCourse } from '@cio/core/services/course/course';
import { ensureCourseSlug, generateUniqueCourseSlug } from '@cio/core/services/course/landing-page';
import {
  evaluateCourseGoLiveReadiness,
  getCourseGoLiveReadiness,
  publishCourseWhenReady
} from '@cio/core/services/course/go-live-readiness';

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn()
}));

vi.mock('@cio/db/queries/course/content', () => ({
  getCourseContentItems: vi.fn()
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  updateCourse: vi.fn()
}));

vi.mock('@cio/core/services/course/landing-page', () => ({
  ensureCourseSlug: vi.fn(),
  generateUniqueCourseSlug: vi.fn()
}));

vi.mock('@cio/core/config/dashboard-url', () => ({
  getDashboardBaseUrl: vi.fn(() => 'https://school.example.com')
}));

const mockedGetCourseById = vi.mocked(getCourseById);
const mockedGetCourseContentItems = vi.mocked(getCourseContentItems);
const mockedGetCourseOrganizationId = vi.mocked(getCourseOrganizationId);
const mockedGetOrganizationById = vi.mocked(getOrganizationById);
const mockedUpdateCourse = vi.mocked(updateCourse);
const mockedEnsureCourseSlug = vi.mocked(ensureCourseSlug);
const mockedGenerateUniqueCourseSlug = vi.mocked(generateUniqueCourseSlug);

function buildCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    title: 'Workplace Safety Essentials',
    description: 'A practical course for safer day-to-day workplace decisions.',
    overview: 'Learn the policies, habits, and reporting steps that keep teams safe.',
    slug: 'workplace-safety-essentials',
    logo: 'https://example.com/banner.jpg',
    bannerImage: null,
    metadata: {
      description: 'A public-facing overview of the safety course.',
      goals: 'Identify hazards, report incidents, and follow safe operating procedures.',
      requirements: 'No prior training required.',
      instructor: {
        name: 'Ada Instructor',
        role: 'Safety Lead',
        coursesNo: 4,
        description: 'Experienced workplace safety instructor.',
        imgUrl: ''
      },
      reviews: [
        {
          id: 1,
          hide: false,
          name: 'Learner',
          avatar_url: '',
          rating: 5,
          created_at: 1,
          description: 'Clear and useful.'
        }
      ],
      allowNewStudent: true
    },
    type: 'SELF_PACED',
    cost: 0,
    ...overrides
  };
}

function buildContentItem(overrides: Partial<CourseContentItemRow> = {}): CourseContentItemRow {
  return {
    id: 'lesson-1',
    type: ContentType.Lesson,
    title: 'Introduction',
    order: 0,
    createdAt: null,
    sectionId: null,
    isUnlocked: true,
    isComplete: false,
    lessonAt: null,
    callUrl: null,
    hasNoteContent: true,
    hasSlideContent: false,
    videosCount: 0,
    documentsCount: 0,
    questionCount: null,
    dueBy: null,
    ...overrides
  };
}

describe('evaluateCourseGoLiveReadiness', () => {
  it('returns blockers for missing course, landing page, and content requirements', () => {
    const readiness = evaluateCourseGoLiveReadiness({
      course: buildCourse({
        title: 'Untitled course',
        description: '',
        overview: 'Welcome to this amazing course',
        slug: null,
        logo: '',
        metadata: { allowNewStudent: true }
      }) as never,
      contentItems: [],
      organization: null
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining([
        'COURSE_TITLE_MISSING',
        'COURSE_DESCRIPTION_MISSING',
        'COURSE_SLUG_MISSING',
        'LANDING_OVERVIEW_MISSING',
        'LANDING_DESCRIPTION_MISSING',
        'LANDING_GOALS_MISSING',
        'LANDING_REQUIREMENTS_MISSING',
        'LANDING_IMAGE_MISSING',
        'COURSE_CONTENT_MISSING'
      ])
    );
  });

  it('flags empty lessons and exercises without questions', () => {
    const readiness = evaluateCourseGoLiveReadiness({
      course: buildCourse() as never,
      contentItems: [
        buildContentItem({ hasNoteContent: false, hasSlideContent: false }),
        buildContentItem({
          id: 'exercise-1',
          type: ContentType.Exercise,
          title: 'Final quiz',
          questionCount: 0
        })
      ],
      organization: null
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining(['LESSON_CONTENT_EMPTY', 'EXERCISE_QUESTIONS_MISSING'])
    );
  });

  it('returns ready when required fields and content are complete', () => {
    const readiness = evaluateCourseGoLiveReadiness({
      course: buildCourse() as never,
      contentItems: [buildContentItem()],
      organization: {
        customDomain: 'school.example.com',
        isCustomDomainVerified: true,
        siteName: 'school'
      } as never
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.courseUrl).toBe('https://school.example.com/course/workplace-safety-essentials');
  });
});

describe('course go-live service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCourseOrganizationId.mockResolvedValue('org-1');
    mockedGetOrganizationById.mockResolvedValue({
      customDomain: 'school.example.com',
      isCustomDomainVerified: true,
      siteName: 'school'
    } as never);
    mockedGenerateUniqueCourseSlug.mockResolvedValue('workplace-safety-essentials');
  });

  it('suggests a unique slug when a ready course has no slug', async () => {
    mockedGetCourseById.mockResolvedValue([buildCourse({ slug: null })] as never);
    mockedGetCourseContentItems.mockResolvedValue([buildContentItem()] as never);

    const readiness = await getCourseGoLiveReadiness('course-1');

    expect(readiness.ready).toBe(true);
    expect(readiness.suggestedFixes.slug).toBe('workplace-safety-essentials');
    expect(readiness.courseUrl).toBe('https://school.example.com/course/workplace-safety-essentials');
    expect(mockedGenerateUniqueCourseSlug).toHaveBeenCalledWith('workplace-safety-essentials');
  });

  it('does not publish when readiness blockers remain', async () => {
    mockedGetCourseById.mockResolvedValue([buildCourse({ description: '' })] as never);
    mockedGetCourseContentItems.mockResolvedValue([buildContentItem()] as never);

    await expect(publishCourseWhenReady('course-1')).rejects.toThrow('Course is not ready to go live');
    expect(mockedUpdateCourse).not.toHaveBeenCalled();
  });

  it('generates a slug and publishes when the course is ready', async () => {
    const course = buildCourse({ slug: null });
    mockedGetCourseById.mockResolvedValue([course] as never);
    mockedGetCourseContentItems.mockResolvedValue([buildContentItem()] as never);
    mockedEnsureCourseSlug.mockResolvedValue('workplace-safety-essentials');
    mockedUpdateCourse.mockResolvedValue({
      ...course,
      slug: 'workplace-safety-essentials',
      isPublished: true
    } as never);

    const result = await publishCourseWhenReady('course-1');

    expect(mockedEnsureCourseSlug).toHaveBeenCalledWith('course-1', course.title);
    expect(mockedUpdateCourse).toHaveBeenCalledWith('course-1', {
      slug: 'workplace-safety-essentials',
      isPublished: true
    });
    expect(result.course.isPublished).toBe(true);
    expect(result.readiness.ready).toBe(true);
  });
});
