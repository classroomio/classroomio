import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getPluginCourseById: vi.fn(),
  getPluginCoursesList: vi.fn(),
  getPluginCourseStructure: vi.fn(),
  getPluginLatestPublishedCourse: vi.fn(),
  getPluginLessonAccessContext: vi.fn(),
  getPluginLessonById: vi.fn(),
  getPluginLessonContent: vi.fn(),
  getPluginLessonReadingSource: vi.fn(),
  getPluginLessonsByCourseId: vi.fn(),
  getInstallationGrants: vi.fn(),
  getUserOrgRole: vi.fn()
}));

const accessMocks = vi.hoisted(() => ({
  assertCourseMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries', () => dbMocks);
vi.mock('@api/services/v1/shared', () => accessMocks);

import { getLessonReadingMetricsForPlugin } from '@api/services/plugin/content';

describe('plugin lesson content API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue({
      id: 'installation-1',
      ownerType: 'organization',
      organizationId: 'organization-1',
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'lesson.metadata:read' },
      { scope: 'course.metadata:read' }
    ]);
    dbMocks.getUserOrgRole.mockResolvedValue(1);
  });

  it('returns computed metrics without exposing lesson content', async () => {
    dbMocks.getPluginLessonReadingSource.mockResolvedValue({
      content: '<p>One two three four five six</p>'
    });

    await expect(getLessonReadingMetricsForPlugin('installation-1', 'organization-1', 'lesson-1')).resolves.toEqual({
      wordCount: 6,
      estimatedMinutes: 1
    });
  });

  it('rejects an installation without the declared permission', async () => {
    dbMocks.getInstallationGrants.mockResolvedValue([{ scope: 'course.metadata:read' }]);

    await expect(
      getLessonReadingMetricsForPlugin('installation-1', 'organization-1', 'lesson-1')
    ).rejects.toMatchObject({
      code: 'PLUGIN_PERMISSION_DENIED',
      statusCode: 403
    });
    expect(dbMocks.getPluginLessonReadingSource).not.toHaveBeenCalled();
  });

  it('does not allow an installation to cross organization boundaries', async () => {
    await expect(
      getLessonReadingMetricsForPlugin('installation-1', 'organization-2', 'lesson-1')
    ).rejects.toMatchObject({
      code: 'INSTALLATION_NOT_FOUND',
      statusCode: 404
    });
    expect(dbMocks.getInstallationGrants).not.toHaveBeenCalled();
  });

  it('returns only the latest published course metadata allowed by the plugin API', async () => {
    dbMocks.getPluginLatestPublishedCourse.mockResolvedValue({
      id: 'course-1',
      title: 'Modern Web Development',
      slug: 'modern-web-development'
    });

    const { getLatestPublishedCourseForPlugin } = await import('@api/services/plugin/content');

    await expect(getLatestPublishedCourseForPlugin('installation-1', 'organization-1')).resolves.toEqual({
      id: 'course-1',
      title: 'Modern Web Development',
      slug: 'modern-web-development'
    });
    expect(dbMocks.getInstallationGrants).toHaveBeenCalledWith('installation-1');
  });

  it('lists courses for plugin with cursor pagination', async () => {
    dbMocks.getPluginCoursesList = vi.fn().mockResolvedValue({
      items: [
        {
          id: 'course-1',
          title: 'Course 1',
          slug: 'course-1',
          description: 'Desc',
          imageUrl: null,
          status: 'ACTIVE',
          visibility: 'public',
          published: true,
          publishedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ],
      nextCursor: 'next-page'
    });

    const { listCoursesForPlugin } = await import('@api/services/plugin/content');
    const result = await listCoursesForPlugin('installation-1', 'organization-1', 'actor-1', { limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe('next-page');
    expect(dbMocks.getInstallationGrants).toHaveBeenCalledWith('installation-1');
  });

  it('gets a single course and rejects with 404 when not found', async () => {
    dbMocks.getPluginCourseById = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'course-1',
        title: 'Course 1',
        slug: 'course-1',
        description: 'Desc',
        imageUrl: null,
        status: 'ACTIVE',
        visibility: 'public',
        published: true,
        publishedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })
      .mockResolvedValueOnce(null);

    const { getCourseForPlugin } = await import('@api/services/plugin/content');
    await expect(getCourseForPlugin('installation-1', 'organization-1', 'actor-1', 'course-1')).resolves.toMatchObject({
      id: 'course-1'
    });

    await expect(getCourseForPlugin('installation-1', 'organization-1', 'actor-1', 'course-2')).rejects.toMatchObject({
      code: 'COURSE_NOT_FOUND',
      statusCode: 404
    });
  });

  it('lists lessons for plugin computing reading metrics and rejects missing course', async () => {
    dbMocks.getPluginLessonsByCourseId = vi
      .fn()
      .mockResolvedValueOnce({
        items: [
          {
            id: 'lesson-1',
            courseId: 'course-1',
            title: 'Lesson 1',
            order: 1,
            public: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            content: '<p>One two three four five six seven eight nine ten</p>'
          }
        ],
        nextCursor: null
      })
      .mockResolvedValueOnce(null);

    const { listLessonsForPlugin } = await import('@api/services/plugin/content');
    const result = await listLessonsForPlugin('installation-1', 'organization-1', 'actor-1', 'course-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'lesson-1',
      wordCount: 10,
      estimatedMinutes: 1,
      type: 'lesson',
      published: true
    });

    await expect(
      listLessonsForPlugin('installation-1', 'organization-1', 'actor-1', 'course-nonexistent')
    ).rejects.toMatchObject({
      code: 'COURSE_NOT_FOUND',
      statusCode: 404
    });
  });

  it('gets a single lesson computing reading metrics and rejects missing lesson', async () => {
    dbMocks.getPluginLessonById = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'lesson-1',
        courseId: 'course-1',
        title: 'Lesson 1',
        order: 1,
        public: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        content: '<p>' + 'word '.repeat(450) + '</p>'
      })
      .mockResolvedValueOnce(null);

    const { getLessonForPlugin } = await import('@api/services/plugin/content');
    const lesson = await getLessonForPlugin('installation-1', 'organization-1', 'actor-1', 'lesson-1');

    expect(lesson).toMatchObject({
      id: 'lesson-1',
      wordCount: 450,
      estimatedMinutes: 3,
      published: false
    });

    await expect(getLessonForPlugin('installation-1', 'organization-1', 'actor-1', 'lesson-2')).rejects.toMatchObject({
      code: 'LESSON_NOT_FOUND',
      statusCode: 404
    });
  });

  it('gets course structure for plugin and validates schema', async () => {
    dbMocks.getInstallationGrants.mockResolvedValue([{ scope: 'course.content:read' }]);
    dbMocks.getPluginCourseStructure.mockResolvedValueOnce({
      courseId: '2194bd50-7590-41e3-b381-917dc347176a',
      sections: [
        {
          id: '3194bd50-7590-41e3-b381-917dc347176b',
          title: 'Section 1',
          order: 1,
          lessons: [
            {
              id: '4194bd50-7590-41e3-b381-917dc347176c',
              title: 'Lesson 1',
              order: 1,
              type: 'lesson'
            }
          ]
        }
      ]
    });

    const { getCourseStructureForPlugin } = await import('@api/services/plugin/content');
    const result = await getCourseStructureForPlugin(
      'installation-1',
      'organization-1',
      'actor-1',
      '2194bd50-7590-41e3-b381-917dc347176a'
    );

    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].lessons).toHaveLength(1);
    expect(accessMocks.assertCourseMemberOrOrgAdmin).toHaveBeenCalledWith(
      '2194bd50-7590-41e3-b381-917dc347176a',
      'actor-1'
    );
  });

  it('gets sanitized lesson content and attachments for plugin', async () => {
    dbMocks.getInstallationGrants.mockResolvedValue([{ scope: 'lesson.content:read' }]);
    dbMocks.getPluginLessonAccessContext.mockResolvedValue({
      courseId: '2194bd50-7590-41e3-b381-917dc347176a'
    });
    dbMocks.getPluginLessonContent.mockResolvedValueOnce({
      id: '4194bd50-7590-41e3-b381-917dc347176c',
      courseId: '2194bd50-7590-41e3-b381-917dc347176a',
      title: 'Lesson 1',
      order: 1,
      content: '<p>Sanitized content</p>',
      attachments: [{ name: 'doc.pdf', url: 'https://example.com/doc.pdf', type: 'application/pdf' }],
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    const { getLessonContentForPlugin } = await import('@api/services/plugin/content');
    const result = await getLessonContentForPlugin(
      'installation-1',
      'organization-1',
      'actor-1',
      '4194bd50-7590-41e3-b381-917dc347176c'
    );

    expect(result).toMatchObject({
      id: '4194bd50-7590-41e3-b381-917dc347176c',
      content: '<p>Sanitized content</p>',
      wordCount: 2,
      estimatedMinutes: 1
    });
    expect(result.attachments).toHaveLength(1);
    expect(accessMocks.assertCourseMemberOrOrgAdmin).toHaveBeenCalledWith(
      '2194bd50-7590-41e3-b381-917dc347176a',
      'actor-1'
    );
  });
});
