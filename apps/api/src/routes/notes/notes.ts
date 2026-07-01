import {
  ZCreateNote,
  ZListNotesQuery,
  ZNoteIdParam,
  ZNoteVersionHistoryQuery,
  ZNoteVersionIdParam,
  ZUpdateNote
} from '@cio/utils/validation/notes';
import {
  createNoteService,
  deleteNoteService,
  getNoteService,
  getNoteVersionHistoryService,
  getWorkspaceNoteUsageService,
  listNotesService,
  restoreNoteVersionService,
  updateNoteService
} from '@api/services/notes/notes';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

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

      const data = await listNotesService(organizationId, user.id, query);

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
  .get('/:noteId', authMiddleware, orgMemberMiddleware, zValidator('param', ZNoteIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { noteId } = c.req.valid('param');
      const data = await getNoteService(organizationId, user.id, noteId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get note');
    }
  })
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
        const data = await updateNoteService(organizationId, user.id, noteId, body);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update note');
      }
    }
  )
  .delete('/:noteId', authMiddleware, orgMemberMiddleware, zValidator('param', ZNoteIdParam), async (c) => {
    try {
      const user = c.get('user')!;
      const organizationId = c.get('orgId')!;
      const { noteId } = c.req.valid('param');
      const data = await deleteNoteService(organizationId, user.id, noteId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete note');
    }
  })
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
        const data = await getNoteVersionHistoryService(organizationId, user.id, noteId, endRange);

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
        const data = await restoreNoteVersionService(organizationId, user.id, noteId, versionId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to restore note version');
      }
    }
  );
