import {
  ZAiNoteCommentReview,
  ZCreateNote,
  ZCreateNoteCommentReply,
  ZCreateNoteCommentThread,
  ZCreateNoteFromTemplate,
  ZCreateNoteFromCourseTemplate,
  ZConvertNoteToCourse,
  ZListNotesQuery,
  ZDocCommentIdParam,
  ZDocCommentThreadIdParam,
  ZDocIdParam,
  ZDocTagAssignment,
  ZDocVersionHistoryQuery,
  ZDocVersionIdParam,
  ZReplaceNoteShares,
  ZUpdateNote,
  ZUpdateNoteComment,
  ZUpdateNoteCommentThread,
  ZUpdateNoteVisibility
} from '@cio/utils/validation/docs';
import { importNoteService } from '@api/services/docs/import';
import {
  assertNoteCommentStreamAccess,
  createDocCommentReplyService,
  createDocCommentThreadService,
  deleteNoteCommentService,
  listNoteCommentThreadsService,
  updateDocCommentService,
  updateDocCommentThreadService
} from '@api/services/docs/comments';
import {
  createDocService,
  convertNoteToTemplateService,
  createDocFromTemplateService,
  createDocFromCourseTemplateService,
  deleteDocService,
  favoriteNoteService,
  getDocService,
  getNoteVersionHistoryService,
  getOrganizationDocUsageService,
  listNoteSharesService,
  listDocsSidebarService,
  listDocTemplatesService,
  listDocsService,
  listTrashedDocsService,
  permanentDeleteNoteService,
  replaceNoteSharesService,
  restoreDocService,
  restoreDocVersionService,
  unsetNoteTemplateService,
  unfavoriteNoteService,
  updateDocService,
  updateDocVisibilityService
} from '@api/services/docs/docs';
import { createAiNoteCommentReviewService } from '@api/services/docs/ai-comments';
import { convertNoteToCourseService } from '@api/services/docs/convert-course';
import { getNoteTagsService, replaceNoteTagsService } from '@api/services/docs/tags';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { streamSSE } from 'hono/streaming';
import { subscribeNoteCommentEvents } from '@cio/core/utils/redis/doc-comments-pubsub';

export const docsRouter = new Hono()
  .get('/usage', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const data = await getOrganizationDocUsageService(organizationId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get note usage');
    }
  })
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('query', ZListNotesQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const query = c.req.valid('query');

      if (query.organizationId !== organizationId) {
        return c.json({ success: false, error: 'Organization mismatch', code: 'FORBIDDEN' }, 403);
      }

      const data = await listDocsService(organizationId, user.id, c.get('userRole')!, query);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list notes');
    }
  })
  .post('/', authMiddleware, orgMemberMiddleware, zValidator('json', ZCreateNote), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const body = c.req.valid('json');

      if (body.organizationId !== organizationId) {
        return c.json({ success: false, error: 'Organization mismatch', code: 'FORBIDDEN' }, 403);
      }

      const data = await createDocService(user.id, c.get('userRole')!, body);

      return c.json({ success: true, data }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create note');
    }
  })
  .post('/import', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const body = await c.req.parseBody();
      const file = body.file;

      if (!(file instanceof File)) {
        throw new AppError('File is required', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const data = await importNoteService({
        ownerId: user.id,
        roleId: c.get('userRole')!,
        organizationId,
        file
      });

      return c.json({ success: true, data }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to import note');
    }
  })
  .get('/templates', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const organizationId = c.get('orgId')!;
      const data = await listDocTemplatesService(organizationId, c.get('userRole')!);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list note templates');
    }
  })
  .get('/sidebar', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const data = await listDocsSidebarService(organizationId, user.id, c.get('userRole')!);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list sidebar notes');
    }
  })
  .get('/trash', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const data = await listTrashedDocsService(organizationId, user.id);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list trashed notes');
    }
  })
  .post(
    '/from-template',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZCreateNoteFromTemplate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const body = c.req.valid('json');

        if (body.organizationId !== organizationId) {
          return c.json({ success: false, error: 'Organization mismatch', code: 'FORBIDDEN' }, 403);
        }

        const data = await createDocFromTemplateService(user.id, organizationId, c.get('userRole')!, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create note from template');
      }
    }
  )
  .post(
    '/from-course-template',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZCreateNoteFromCourseTemplate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const body = c.req.valid('json');

        if (body.organizationId !== organizationId) {
          return c.json({ success: false, error: 'Organization mismatch', code: 'FORBIDDEN' }, 403);
        }

        const data = await createDocFromCourseTemplateService(user.id, organizationId, c.get('userRole')!, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create note from course template');
      }
    }
  )
  .get('/:docId', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await getDocService(organizationId, user.id, c.get('userRole')!, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get note');
    }
  })
  .get('/:docId/tags', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await getNoteTagsService(organizationId, user.id, c.get('userRole')!, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch note tags');
    }
  })
  .put(
    '/:docId/tags',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZDocTagAssignment),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await replaceNoteTagsService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to assign note tags');
      }
    }
  )
  .put(
    '/:docId/visibility',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZUpdateNoteVisibility),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateDocVisibilityService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note visibility');
      }
    }
  )
  .put(
    '/:docId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZUpdateNote),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateDocService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note');
      }
    }
  )
  .post(
    '/:docId/convert-to-template',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const data = await convertNoteToTemplateService(organizationId, user.id, c.get('userRole')!, docId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to convert note to template');
      }
    }
  )
  .post(
    '/:docId/unset-template',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const data = await unsetNoteTemplateService(organizationId, user.id, c.get('userRole')!, docId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove note template');
      }
    }
  )
  .post(
    '/:docId/convert-to-course',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZConvertNoteToCourse),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await convertNoteToCourseService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to convert note to course');
      }
    }
  )
  .delete('/:docId', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await deleteDocService(organizationId, user.id, c.get('userRole')!, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete note');
    }
  })
  .post('/:docId/favorite', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await favoriteNoteService(organizationId, user.id, c.get('userRole')!, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to favorite note');
    }
  })
  .delete('/:docId/favorite', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await unfavoriteNoteService(organizationId, user.id, c.get('userRole')!, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to unfavorite note');
    }
  })
  .get('/:docId/shares', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await listNoteSharesService(organizationId, user.id, c.get('userRole')!, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list note shares');
    }
  })
  .put(
    '/:docId/shares',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZReplaceNoteShares),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await replaceNoteSharesService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note shares');
      }
    }
  )
  .post('/:docId/restore', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await restoreDocService(organizationId, user.id, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to restore note');
    }
  })
  .delete('/:docId/permanent', authMiddleware, orgMemberMiddleware, zValidator('param', ZDocIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { docId } = c.req.valid('param');
      const data = await permanentDeleteNoteService(organizationId, user.id, docId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to permanently delete note');
    }
  })
  .get(
    '/:docId/comment-threads',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const data = await listNoteCommentThreadsService(organizationId, user.id, c.get('userRole')!, docId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list note comment threads');
      }
    }
  )
  .post(
    '/:docId/comment-threads',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZCreateNoteCommentThread),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await createDocCommentThreadService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create note comment thread');
      }
    }
  )
  .post(
    '/:docId/comment-threads/ai-review',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('json', ZAiNoteCommentReview),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await createAiNoteCommentReviewService(organizationId, user.id, c.get('userRole')!, docId, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create AI note comment review');
      }
    }
  )
  .post(
    '/:docId/comment-threads/:threadId/replies',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocCommentThreadIdParam),
    zValidator('json', ZCreateNoteCommentReply),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId, threadId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await createDocCommentReplyService(
          organizationId,
          user.id,
          c.get('userRole')!,
          docId,
          threadId,
          body
        );

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create note comment reply');
      }
    }
  )
  .patch(
    '/:docId/comment-threads/:threadId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocCommentThreadIdParam),
    zValidator('json', ZUpdateNoteCommentThread),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId, threadId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateDocCommentThreadService(
          organizationId,
          user.id,
          c.get('userRole')!,
          docId,
          threadId,
          body
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note comment thread');
      }
    }
  )
  .patch(
    '/:docId/comments/:commentId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocCommentIdParam),
    zValidator('json', ZUpdateNoteComment),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId, commentId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateDocCommentService(
          organizationId,
          user.id,
          c.get('userRole')!,
          docId,
          commentId,
          body
        );

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note comment');
      }
    }
  )
  .delete(
    '/:docId/comments/:commentId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocCommentIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId, commentId } = c.req.valid('param');
        const data = await deleteNoteCommentService(organizationId, user.id, c.get('userRole')!, docId, commentId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete note comment');
      }
    }
  )
  .get(
    '/:docId/comment-threads/stream',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');

        await assertNoteCommentStreamAccess(organizationId, user.id, c.get('userRole')!, docId);

        return streamSSE(c, async (stream) => {
          let unsubscribe: (() => Promise<void>) | null = null;

          stream.onAbort(async () => {
            if (unsubscribe) {
              await unsubscribe();
            }
          });

          unsubscribe = await subscribeNoteCommentEvents(docId, async (event) => {
            await stream.writeSSE({
              event: event.type,
              data: JSON.stringify(event)
            });
          });

          while (true) {
            await stream.writeSSE({ event: 'ping', data: '{}' });
            await stream.sleep(30000);
          }
        });
      } catch (error) {
        return handleError(c, error, 'Failed to stream note comment updates');
      }
    }
  )
  .get(
    '/:docId/versions',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocIdParam),
    zValidator('query', ZDocVersionHistoryQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId } = c.req.valid('param');
        const { endRange } = c.req.valid('query');
        const data = await getNoteVersionHistoryService(organizationId, user.id, c.get('userRole')!, docId, endRange);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch note version history');
      }
    }
  )
  .post(
    '/:docId/versions/:versionId/restore',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZDocVersionIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { docId, versionId } = c.req.valid('param');
        const data = await restoreDocVersionService(organizationId, user.id, c.get('userRole')!, docId, versionId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to restore note version');
      }
    }
  );
