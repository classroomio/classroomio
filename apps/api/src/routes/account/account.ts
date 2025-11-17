import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { getAccountData } from '@api/services/account';
import { handleError } from '@api/utils/errors';

export const accountRouter = new Hono().get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    console.time('accountRouter');
    const accountData = await getAccountData(user.id);
    console.timeEnd('accountRouter');

    return c.json(
      {
        success: true,
        user,
        profile: accountData.profile,
        organizations: accountData.organizations
      },
      200
    );
  } catch (error) {
    return handleError(c, error, 'Failed to fetch account data');
  }
});
