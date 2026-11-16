import {
  ZSkillCreate,
  ZSkillImport,
  ZSkillListQuery,
  ZSkillParam,
  ZSkillUpdate,
  ZSuggestSkills
} from '@cio/utils/validation/skill';
import {
  createSkillService,
  deleteSkillService,
  importSkillsService,
  listSkillsService,
  updateSkillService
} from '@api/services/skill/skill';
import { suggestSkillsWithModel } from '@api/services/skill/suggest';
import { assertCourseInOrg } from '@api/services/math/course-access';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const skillRouter = new Hono()
  .get('/', authMiddleware, orgTeamMemberMiddleware, zValidator('query', ZSkillListQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await listSkillsService(orgId, c.req.valid('query'));

      return c.json({ success: true as const, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list skills');
    }
  })
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZSkillCreate), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await createSkillService(orgId, c.req.valid('json'));

      return c.json({ success: true as const, data }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create skill');
    }
  })
  .post('/import', authMiddleware, orgAdminMiddleware, zValidator('json', ZSkillImport), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await importSkillsService(orgId, c.req.valid('json'));

      return c.json({ success: true as const, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to import skills');
    }
  })
  .post('/suggest', authMiddleware, orgTeamMemberMiddleware, zValidator('json', ZSuggestSkills), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const input = c.req.valid('json');

      await assertCourseInOrg(input.courseId, orgId);
      const data = await suggestSkillsWithModel(orgId, user.id, input.courseId, input);

      return c.json({ success: true as const, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to suggest skills');
    }
  })
  .put(
    '/:skillId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZSkillParam),
    zValidator('json', ZSkillUpdate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { skillId } = c.req.valid('param');
        const data = await updateSkillService(orgId, skillId, c.req.valid('json'));

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update skill');
      }
    }
  )
  .delete('/:skillId', authMiddleware, orgAdminMiddleware, zValidator('param', ZSkillParam), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { skillId } = c.req.valid('param');
      const data = await deleteSkillService(orgId, skillId);

      return c.json({ success: true as const, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete skill');
    }
  });
