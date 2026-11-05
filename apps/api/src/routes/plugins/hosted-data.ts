import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import {
  ZPluginApiApplyCertificateTemplate,
  ZPluginApiLessonProgressUpdate,
  ZPluginApiListQuery
} from '@cio/utils/validation/plugin';
import {
  applyHostedCertificateTemplate,
  getHostedAppliedCertificateTemplate,
  getHostedCertificate,
  getHostedCourse,
  getHostedCourseProgress,
  getHostedCourseStructure,
  getHostedExercise,
  getHostedIdentity,
  getHostedLesson,
  getHostedLessonContent,
  getHostedLessonProgress,
  getHostedOrganization,
  listHostedCertificates,
  listHostedCertificateTemplates,
  listHostedCourses,
  listHostedExercises,
  listHostedLessons,
  setHostedLessonProgress
} from '@api/services/plugin';
import * as z from 'zod';

const ZInstallationParam = z.object({ installationId: z.string().uuid() });
const ZCourseParam = ZInstallationParam.extend({ courseId: z.string().uuid() });
const ZLessonParam = ZInstallationParam.extend({ lessonId: z.string().uuid() });
const ZExerciseParam = ZInstallationParam.extend({ exerciseId: z.string().uuid() });
const ZCertificateParam = ZInstallationParam.extend({ certificateId: z.string().uuid() });
const ZCourseListQuery = ZPluginApiListQuery.extend({ publishedOnly: z.coerce.boolean().optional() });
const ZLessonListQuery = ZPluginApiListQuery.extend({ courseId: z.string().uuid() });
const ZExerciseListQuery = ZLessonListQuery.extend({ lessonId: z.string().uuid().optional() });
const ZCertificateListQuery = ZPluginApiListQuery.extend({ courseId: z.string().uuid().optional() });

function context(c: any) {
  const installationId = c.req.param('installationId') as string;
  const organizationId = c.get('orgId') as string;
  const actorId = c.get('user')!.id as string;

  return [installationId, organizationId, actorId] as const;
}

export const pluginHostedDataRouter = new Hono()
  .use('*', authMiddleware, orgMemberMiddleware)
  .get('/:installationId/data/identity', zValidator('param', ZInstallationParam), async (c) => {
    try {
      const data = await getHostedIdentity(...context(c));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin identity');
    }
  })
  .get('/:installationId/data/organization', zValidator('param', ZInstallationParam), async (c) => {
    try {
      const data = await getHostedOrganization(...context(c));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin organization');
    }
  })
  .get(
    '/:installationId/data/courses',
    zValidator('param', ZInstallationParam),
    zValidator('query', ZCourseListQuery),
    async (c) => {
      try {
        const data = await listHostedCourses(...context(c), c.req.valid('query'));
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list plugin courses');
      }
    }
  )
  .get('/:installationId/data/courses/:courseId', zValidator('param', ZCourseParam), async (c) => {
    try {
      const data = await getHostedCourse(...context(c), c.req.param('courseId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin course');
    }
  })
  .get('/:installationId/data/courses/:courseId/structure', zValidator('param', ZCourseParam), async (c) => {
    try {
      const data = await getHostedCourseStructure(...context(c), c.req.param('courseId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin course structure');
    }
  })
  .get(
    '/:installationId/data/lessons',
    zValidator('param', ZInstallationParam),
    zValidator('query', ZLessonListQuery),
    async (c) => {
      try {
        const query = c.req.valid('query');
        const data = await listHostedLessons(...context(c), query.courseId, query);
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list plugin lessons');
      }
    }
  )
  .get('/:installationId/data/lessons/:lessonId', zValidator('param', ZLessonParam), async (c) => {
    try {
      const data = await getHostedLesson(...context(c), c.req.param('lessonId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin lesson');
    }
  })
  .get('/:installationId/data/lessons/:lessonId/content', zValidator('param', ZLessonParam), async (c) => {
    try {
      const data = await getHostedLessonContent(...context(c), c.req.param('lessonId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin lesson content');
    }
  })
  .get(
    '/:installationId/data/exercises',
    zValidator('param', ZInstallationParam),
    zValidator('query', ZExerciseListQuery),
    async (c) => {
      try {
        const query = c.req.valid('query');
        const data = await listHostedExercises(...context(c), query.courseId, query);
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list plugin exercises');
      }
    }
  )
  .get('/:installationId/data/exercises/:exerciseId', zValidator('param', ZExerciseParam), async (c) => {
    try {
      const data = await getHostedExercise(...context(c), c.req.param('exerciseId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin exercise');
    }
  })
  .get('/:installationId/data/progress/lessons/:lessonId', zValidator('param', ZLessonParam), async (c) => {
    try {
      const data = await getHostedLessonProgress(...context(c), c.req.param('lessonId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin lesson progress');
    }
  })
  .put(
    '/:installationId/data/progress/lessons/:lessonId',
    zValidator('param', ZLessonParam),
    zValidator('json', ZPluginApiLessonProgressUpdate),
    async (c) => {
      try {
        const data = await setHostedLessonProgress(
          ...context(c),
          c.req.param('lessonId'),
          c.req.valid('json').isComplete
        );
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update plugin lesson progress');
      }
    }
  )
  .get('/:installationId/data/progress/courses/:courseId', zValidator('param', ZCourseParam), async (c) => {
    try {
      const data = await getHostedCourseProgress(...context(c), c.req.param('courseId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin course progress');
    }
  })
  .get(
    '/:installationId/data/certificates',
    zValidator('param', ZInstallationParam),
    zValidator('query', ZCertificateListQuery),
    async (c) => {
      try {
        const data = await listHostedCertificates(...context(c), c.req.valid('query'));
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list plugin certificates');
      }
    }
  )
  .get('/:installationId/data/certificates/:certificateId', zValidator('param', ZCertificateParam), async (c) => {
    try {
      const data = await getHostedCertificate(...context(c), c.req.param('certificateId'));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch plugin certificate');
    }
  })
  .get('/:installationId/data/certificate-templates', zValidator('param', ZInstallationParam), async (c) => {
    try {
      const data = await listHostedCertificateTemplates(...context(c));
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list certificate templates');
    }
  })
  .get(
    '/:installationId/data/certificate-templates/applied/:courseId',
    zValidator('param', ZCourseParam),
    async (c) => {
      try {
        const data = await getHostedAppliedCertificateTemplate(...context(c), c.req.param('courseId'));
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch applied certificate template');
      }
    }
  )
  .put(
    '/:installationId/data/certificate-templates/applied/:courseId',
    zValidator('param', ZCourseParam),
    zValidator('json', ZPluginApiApplyCertificateTemplate),
    async (c) => {
      try {
        const [installationId, organizationId, actorId] = context(c);
        const input = c.req.valid('json');
        const data = await applyHostedCertificateTemplate({
          installationId,
          organizationId,
          actorId,
          courseId: c.req.param('courseId'),
          externalTemplateId: input.externalTemplateId,
          externalTemplateVersion: input.externalTemplateVersion,
          name: input.name,
          design: input.design
        });
        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to apply certificate template');
      }
    }
  );
