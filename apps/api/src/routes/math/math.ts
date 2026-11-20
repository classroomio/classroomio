import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZMathConvertImageBody, ZMathImportWorksheetBody } from '@cio/utils/validation/math';
import { convertImageToMath } from '@api/services/math/convert-image';
import { importWorksheet } from '@api/services/math/import-worksheet';
import { assertCourseInOrg } from '@api/services/math/course-access';
import { enforceMathVisionAllowance, recordMathVisionUsage } from '@api/services/math/vision-usage';

export const mathRouter = new Hono()
  .post('/convert-image', authMiddleware, orgMemberMiddleware, zValidator('json', ZMathConvertImageBody), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { courseId, image } = c.req.valid('json');

      await assertCourseInOrg(courseId, orgId);
      await enforceMathVisionAllowance(orgId);

      const { usage, modelName, ...converted } = await convertImageToMath(image);
      await recordMathVisionUsage(orgId, user.id, courseId, usage, modelName);

      return c.json({ success: true as const, data: converted });
    } catch (error) {
      return handleError(c, error, 'Failed to convert image to math');
    }
  })
  .post(
    '/import-worksheet',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZMathImportWorksheetBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { courseId, document } = c.req.valid('json');

        await assertCourseInOrg(courseId, orgId);
        await enforceMathVisionAllowance(orgId);

        const { usage, modelName, questions } = await importWorksheet(document);
        await recordMathVisionUsage(orgId, user.id, courseId, usage, modelName);

        return c.json({ success: true as const, data: { questions } });
      } catch (error) {
        return handleError(c, error, 'Failed to import worksheet');
      }
    }
  );
