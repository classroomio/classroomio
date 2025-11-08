import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { getOrganizationByProfileId } from '@db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';

export const accountRouter = new Hono().get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  const [profile, organizations] = await Promise.all([getProfileById(user.id), getOrganizationByProfileId(user.id)]);

  return c.json({ success: true, user, profile, organizations }, 200);
});
