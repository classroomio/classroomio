import {
  ZCreateNote,
  ZListNotesQuery,
  ZNoteIdParam,
  ZNoteTagAssignment,
  ZNoteVersionHistoryQuery,
  ZNoteVersionIdParam,
  ZUpdateNote,
  ZUpdateNoteVisibility
} from '@cio/utils/validation/notes';
import { importNoteService } from '@api/services/notes/import';
import {
  createNoteService,
  deleteNoteService,
  getNoteService,
  getNoteVersionHistoryService,
  getWorkspaceNoteUsageService,
  listNotesService,
  restoreNoteVersionService,
  updateNoteService,
  updateNoteVisibilityService
} from '@api/services/notes/notes';
import { getNoteTagsService, replaceNoteTagsService } from '@api/services/notes/tags';
import { AppError, ErrorCodes } from '@api/utils/errors';
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
