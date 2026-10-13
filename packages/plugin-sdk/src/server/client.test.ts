import { describe, expect, it, vi } from 'vitest';
import { createClassroomIOPluginServerClient } from './client';

describe('ClassroomIOPluginServerClient', () => {
  it('calls the versioned organization profile endpoint with the bearer token', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'f993bf31-e76f-4f5b-831c-c05f2f571bd0',
            name: 'Acme Academy',
            avatarUrl: null,
            locale: 'en'
          },
          requestId: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com/',
      accessToken: 'test-access-token',
      fetch: fetchImplementation
    });

    await expect(client.organization.getProfile()).resolves.toMatchObject({ name: 'Acme Academy' });
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.classroomio.com/plugin-api/v1/organization/profile',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer test-access-token' })
      })
    );
  });

  it('calls the versioned identity profile endpoint with the bearer token', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: '2194bd50-7590-41e3-b381-917dc347176f',
            displayName: 'Jane Doe',
            avatarUrl: 'https://example.com/avatar.png',
            locale: 'en',
            role: 'student'
          },
          requestId: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com/',
      accessToken: 'test-access-token',
      fetch: fetchImplementation
    });

    await expect(client.identity.getProfile()).resolves.toEqual({
      id: '2194bd50-7590-41e3-b381-917dc347176f',
      displayName: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.png',
      locale: 'en',
      role: 'student'
    });
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.classroomio.com/plugin-api/v1/identity/profile',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer test-access-token' })
      })
    );
  });

  it('surfaces stable API error details', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'permission_denied', message: 'Permission denied', retryable: false },
          requestId: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50'
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    );
    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com',
      accessToken: 'test-access-token',
      fetch: fetchImplementation
    });

    await expect(client.organization.getProfile()).rejects.toMatchObject({
      code: 'permission_denied',
      requestId: '93567c57-d8a4-4bf6-a9c7-01c65ef42f50',
      status: 403
    });
  });

  it('lists and gets courses through client.courses', async () => {
    const course = {
      id: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
      title: 'Fullstack Rust',
      slug: 'fullstack-rust',
      description: 'Production Rust web services',
      imageUrl: null,
      status: 'ACTIVE',
      visibility: 'public',
      published: true,
      publishedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { items: [course], nextCursor: 'next-page-token' },
            requestId: 'req-1'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: course,
            requestId: 'req-2'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com',
      accessToken: 'test-token',
      fetch: fetchImplementation
    });

    const listResult = await client.courses.list({ limit: 10, cursor: 'prev-token' });
    expect(listResult).toEqual({
      items: [course],
      nextCursor: 'next-page-token'
    });
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      'https://api.classroomio.com/plugin-api/v1/courses?limit=10&cursor=prev-token',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    const singleResult = await client.courses.get(course.id);
    expect(singleResult).toEqual(course);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      `https://api.classroomio.com/plugin-api/v1/courses/${course.id}`,
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );
  });

  it('lists and gets lessons through client.lessons', async () => {
    const lesson = {
      id: 'f1406f0e-3676-4d05-b384-368798bf2df7',
      courseId: 'e69a0319-9404-4b53-a3d5-1f953047a06d',
      title: 'Memory Management in Rust',
      type: 'lesson',
      order: 1,
      published: true,
      wordCount: 800,
      estimatedMinutes: 4,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { items: [lesson], nextCursor: null },
            requestId: 'req-1'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: lesson,
            requestId: 'req-2'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com',
      accessToken: 'test-token',
      fetch: fetchImplementation
    });

    const listResult = await client.lessons.listByCourse(lesson.courseId, { limit: 5 });
    expect(listResult).toEqual({
      items: [lesson],
      nextCursor: null
    });
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      `https://api.classroomio.com/plugin-api/v1/courses/${lesson.courseId}/lessons?limit=5`,
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    const singleResult = await client.lessons.get(lesson.id);
    expect(singleResult).toEqual(lesson);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      `https://api.classroomio.com/plugin-api/v1/lessons/${lesson.id}`,
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );
  });

  it('reads, updates, and resets learner progress through client.progress and convenience methods', async () => {
    const lessonProgress = { isComplete: true };
    const resetProgress = { isComplete: false };
    const courseProgress = {
      courseId: 'course-1',
      percentage: 100,
      lessonsCompleted: 10,
      totalLessons: 10,
      isComplete: true,
      certificateEarnedAt: '2026-01-01T00:00:00.000Z'
    };

    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: lessonProgress, requestId: 'req-1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: lessonProgress, requestId: 'req-2' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: resetProgress, requestId: 'req-3' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: courseProgress, requestId: 'req-4' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: lessonProgress, requestId: 'req-5' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: courseProgress, requestId: 'req-6' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com',
      accessToken: 'test-token',
      fetch: fetchImplementation
    });

    await expect(client.progress.getLesson('lesson-1')).resolves.toEqual(lessonProgress);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      'https://api.classroomio.com/plugin-api/v1/lessons/lesson-1/progress',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    await expect(client.progress.setLesson('lesson-1', true)).resolves.toEqual(lessonProgress);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      'https://api.classroomio.com/plugin-api/v1/lessons/lesson-1/progress',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        }),
        body: JSON.stringify({ isComplete: true })
      })
    );

    await expect(client.progress.resetLesson('lesson-1')).resolves.toEqual(resetProgress);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      3,
      'https://api.classroomio.com/plugin-api/v1/lessons/lesson-1/progress',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    await expect(client.progress.getCourse('course-1')).resolves.toEqual(courseProgress);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      4,
      'https://api.classroomio.com/plugin-api/v1/courses/course-1/progress',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    await expect(client.lessons.setProgress('lesson-1', true)).resolves.toEqual(lessonProgress);
    await expect(client.courses.getProgress('course-1')).resolves.toEqual(courseProgress);
  });

  it('lists, gets, and applies certificate templates through client.certificateTemplates and course aliases', async () => {
    const sampleTemplate = {
      id: 'classique',
      name: 'Honors Diploma',
      style: 'Victorian',
      description: 'Traditional academic elegance',
      accentColor: '#d4af37',
      subtitle: 'Certificate of Achievement',
      version: 1,
      design: { templateId: 'classique' }
    };

    const appliedTemplate = {
      courseId: 'course-1',
      isDownloadable: true,
      design: { templateId: 'classique' },
      sourceTemplate: {
        pluginId: 'com.classroomio.certificate-studio',
        externalTemplateId: 'classique',
        version: 1,
        name: 'Honors Diploma',
        appliedAt: '2026-01-01T00:00:00.000Z'
      }
    };

    const applyResult = {
      courseId: 'course-1',
      appliedAt: '2026-01-01T00:00:00.000Z',
      templateVersion: 1,
      design: { templateId: 'classique' }
    };

    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [sampleTemplate], requestId: 'req-1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: appliedTemplate, requestId: 'req-2' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: applyResult, requestId: 'req-3' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: appliedTemplate, requestId: 'req-4' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: applyResult, requestId: 'req-5' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com',
      accessToken: 'test-token',
      fetch: fetchImplementation
    });

    await expect(client.certificateTemplates.listAvailable()).resolves.toEqual([sampleTemplate]);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      'https://api.classroomio.com/plugin-api/v1/certificates/templates',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    await expect(client.certificateTemplates.getApplied('course-1')).resolves.toEqual(appliedTemplate);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      'https://api.classroomio.com/plugin-api/v1/courses/course-1/certificate-template',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    const applyPayload = {
      externalTemplateId: 'classique',
      externalTemplateVersion: 1,
      name: 'Honors Diploma',
      design: { templateId: 'classique' }
    };

    await expect(client.certificateTemplates.apply('course-1', applyPayload)).resolves.toEqual(applyResult);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      3,
      'https://api.classroomio.com/plugin-api/v1/courses/course-1/certificate-template',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        }),
        body: JSON.stringify(applyPayload)
      })
    );

    await expect(client.courses.getCertificateTemplate('course-1')).resolves.toEqual(appliedTemplate);
    await expect(client.courses.applyCertificateTemplate('course-1', applyPayload)).resolves.toEqual(applyResult);
  });

  it('reads, lists, sets, and deletes plugin storage records through client.storage', async () => {
    const storageItem = {
      namespace: 'settings',
      key: 'theme',
      value: { mode: 'dark' },
      scope: 'organization' as const,
      updatedAt: '2026-01-01T00:00:00.000Z'
    };

    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: storageItem, requestId: 'req-1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { items: [storageItem] }, requestId: 'req-2' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: storageItem, requestId: 'req-3' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { deleted: true }, requestId: 'req-4' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

    const client = createClassroomIOPluginServerClient({
      baseUrl: 'https://api.classroomio.com',
      accessToken: 'test-token',
      fetch: fetchImplementation
    });

    await expect(client.storage.get('settings', 'theme', { scope: 'organization' })).resolves.toEqual(storageItem);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      'https://api.classroomio.com/plugin-api/v1/storage/settings/theme?scope=organization',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    await expect(client.storage.list('settings', { scope: 'organization' })).resolves.toEqual([storageItem]);
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      'https://api.classroomio.com/plugin-api/v1/storage/settings?scope=organization',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );

    await expect(client.storage.set('settings', 'theme', { mode: 'dark' }, { scope: 'organization' })).resolves.toEqual(
      storageItem
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      3,
      'https://api.classroomio.com/plugin-api/v1/storage/settings/theme',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
          'content-type': 'application/json'
        }),
        body: JSON.stringify({ value: { mode: 'dark' }, scope: 'organization' })
      })
    );

    await expect(client.storage.delete('settings', 'theme', { scope: 'organization' })).resolves.toEqual({
      deleted: true
    });
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      4,
      'https://api.classroomio.com/plugin-api/v1/storage/settings/theme?scope=organization',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ authorization: 'Bearer test-token' })
      })
    );
  });
});
