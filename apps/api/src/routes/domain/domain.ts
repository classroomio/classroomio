import { addDomainToVercel, getConfigResponse, removeDomainFromVercelProject } from '@api/services/org/domain';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { z } from 'zod';

const ZDomainRequest = z.object({
  params: z.object({
    key: z.enum(['verify_domain', 'add_domain', 'remove_domain']),
    domain: z.string().min(1)
  })
});

export const domainRouter = new Hono()
  /**
   * POST /domain
   * Handles domain operations: verify, add, or remove domain
   * Requires authentication
   */
  .post('/', authMiddleware, async (c) => {
    try {
      const body = await c.req.json();
      const validatedData = ZDomainRequest.parse(body);

      const { key, domain } = validatedData.params;

      if (domain.includes('classroomio.com')) {
        return c.json({ success: false }, 400);
      }

      switch (key) {
        case 'verify_domain': {
          const configResponse = await getConfigResponse(domain);
          return c.json({ success: true, verified: !configResponse.misconfigured }, 200);
        }
        case 'add_domain': {
          const addDomainResponse = await addDomainToVercel(domain);
          return c.json({ success: true, data: addDomainResponse }, 200);
        }
        case 'remove_domain': {
          const removeDomainResponse = await removeDomainFromVercelProject(domain);
          return c.json({ success: true, data: removeDomainResponse }, 200);
        }
        default:
          return c.json({ success: false, message: 'Invalid request' }, 400);
      }
    } catch (error) {
      return handleError(c, error, 'Failed to process domain request');
    }
  });
