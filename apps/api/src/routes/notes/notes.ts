import {
  ZAiNoteCommentReview,
  ZCreateNote,
  ZCreateNoteCommentReply,
  ZCreateNoteCommentThread,
  ZCreateNoteFromTemplate,
  ZConvertNoteToCourse,
  ZListNotesQuery,
  ZNoteCommentIdParam,
  ZNoteCommentThreadIdParam,
  ZNoteIdParam,
  ZNoteTagAssignment,
  ZNoteVersionHistoryQuery,
  ZNoteVersionIdParam,
  ZUpdateNote,
  ZUpdateNoteComment,
  ZUpdateNoteCommentThread,
  ZUpdateNoteVisibility
} from '@cio/utils/validation/notes';
import { importNoteService } from '@api/services/notes/import';
import {
  assertNoteCommentStreamAccess,
  createNoteCommentReplyService,
  createNoteCommentThreadService,
  deleteNoteCommentService,
  listNoteCommentThreadsService,
  updateNoteCommentService,
  updateNoteCommentThreadService
} from '@api/services/notes/comments';
import {
  createNoteService,
  convertNoteToTemplateService,
  createNoteFromTemplateService,
  deleteNoteService,
  getNoteService,
  getNoteVersionHistoryService,
  getWorkspaceNoteUsageService,
  listNoteTemplatesService,
  listNotesService,
  restoreNoteVersionService,
  unsetNoteTemplateService,
  updateNoteService,
  updateNoteVisibilityService
} from '@api/services/notes/notes';
import { createAiNoteCommentReviewService } from '@api/services/notes/ai-comments';
import { convertNoteToCourseService } from '@api/services/notes/convert-course';
import { getNoteTagsService, replaceNoteTagsService } from '@api/services/notes/tags';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { streamSSE } from 'hono/streaming';
import { subscribeNoteCommentEvents } from '@cio/core/utils/redis/note-comments-pubsub';

export const notesRouter = new Hono()
  .get('/usage', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const data = await getWorkspaceNoteUsageService(organizationId, user.id);

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

      const data = await listNotesService(organizationId, user.id, c.get('userRole')!, query);

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

      const data = await createNoteService(user.id, body);

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
      const data = await listNoteTemplatesService(organizationId, c.get('userRole')!);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list note templates');
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

        const data = await createNoteFromTemplateService(user.id, organizationId, c.get('userRole')!, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create note from template');
      }
    }
  )
  .get('/:noteId', authMiddleware, orgMemberMiddleware, zValidator('param', ZNoteIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { noteId } = c.req.valid('param');
      const data = await getNoteService(organizationId, user.id, c.get('userRole')!, noteId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get note');
    }
  })
  .get('/:noteId/tags', authMiddleware, orgMemberMiddleware, zValidator('param', ZNoteIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { noteId } = c.req.valid('param');
      const data = await getNoteTagsService(organizationId, user.id, c.get('userRole')!, noteId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch note tags');
    }
  })
  .put(
    '/:noteId/tags',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('json', ZNoteTagAssignment),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await replaceNoteTagsService(organizationId, user.id, c.get('userRole')!, noteId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to assign note tags');
      }
    }
  )
  .put(
    '/:noteId/visibility',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('json', ZUpdateNoteVisibility),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateNoteVisibilityService(organizationId, user.id, c.get('userRole')!, noteId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note visibility');
      }
    }
  )
  .put(
    '/:noteId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('json', ZUpdateNote),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateNoteService(organizationId, user.id, c.get('userRole')!, noteId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note');
      }
    }
  )
  .post(
    '/:noteId/convert-to-template',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const data = await convertNoteToTemplateService(organizationId, user.id, c.get('userRole')!, noteId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to convert note to template');
      }
    }
  )
  .post(
    '/:noteId/unset-template',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const data = await unsetNoteTemplateService(organizationId, user.id, c.get('userRole')!, noteId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to remove note template');
      }
    }
  )
  .post(
    '/:noteId/convert-to-course',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('json', ZConvertNoteToCourse),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await convertNoteToCourseService(organizationId, user.id, c.get('userRole')!, noteId, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to convert note to course');
      }
    }
  )
  .delete('/:noteId', authMiddleware, orgMemberMiddleware, zValidator('param', ZNoteIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { noteId } = c.req.valid('param');
      const data = await deleteNoteService(organizationId, user.id, c.get('userRole')!, noteId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete note');
    }
  })
  .get(
    '/:noteId/comment-threads',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const data = await listNoteCommentThreadsService(organizationId, user.id, c.get('userRole')!, noteId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list note comment threads');
      }
    }
  )
  .post(
    '/:noteId/comment-threads',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('json', ZCreateNoteCommentThread),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await createNoteCommentThreadService(organizationId, user.id, c.get('userRole')!, noteId, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create note comment thread');
      }
    }
  )
  .post(
    '/:noteId/comment-threads/ai-review',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('json', ZAiNoteCommentReview),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await createAiNoteCommentReviewService(organizationId, user.id, c.get('userRole')!, noteId, body);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create AI note comment review');
      }
    }
  )
  .post(
    '/:noteId/comment-threads/:threadId/replies',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteCommentThreadIdParam),
    zValidator('json', ZCreateNoteCommentReply),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId, threadId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await createNoteCommentReplyService(
          organizationId,
          user.id,
          c.get('userRole')!,
          noteId,
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
    '/:noteId/comment-threads/:threadId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteCommentThreadIdParam),
    zValidator('json', ZUpdateNoteCommentThread),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId, threadId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateNoteCommentThreadService(
          organizationId,
          user.id,
          c.get('userRole')!,
          noteId,
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
    '/:noteId/comments/:commentId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteCommentIdParam),
    zValidator('json', ZUpdateNoteComment),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId, commentId } = c.req.valid('param');
        const body = c.req.valid('json');
        const data = await updateNoteCommentService(
          organizationId,
          user.id,
          c.get('userRole')!,
          noteId,
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
    '/:noteId/comments/:commentId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteCommentIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId, commentId } = c.req.valid('param');
        const data = await deleteNoteCommentService(organizationId, user.id, c.get('userRole')!, noteId, commentId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete note comment');
      }
    }
  )
  .get(
    '/:noteId/comment-threads/stream',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');

        await assertNoteCommentStreamAccess(organizationId, user.id, c.get('userRole')!, noteId);

        return streamSSE(c, async (stream) => {
          let unsubscribe: (() => Promise<void>) | null = null;

          stream.onAbort(async () => {
            if (unsubscribe) {
              await unsubscribe();
            }
          });

          unsubscribe = await subscribeNoteCommentEvents(noteId, async (event) => {
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
    '/:noteId/versions',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteIdParam),
    zValidator('query', ZNoteVersionHistoryQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId } = c.req.valid('param');
        const { endRange } = c.req.valid('query');
        const data = await getNoteVersionHistoryService(organizationId, user.id, c.get('userRole')!, noteId, endRange);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch note version history');
      }
    }
  )
  .post(
    '/:noteId/versions/:versionId/restore',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZNoteVersionIdParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const organizationId = c.get('orgId')!;
        const { noteId, versionId } = c.req.valid('param');
        const data = await restoreNoteVersionService(organizationId, user.id, c.get('userRole')!, noteId, versionId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to restore note version');
      }
    }
  );
