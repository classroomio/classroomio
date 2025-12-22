import { AppError, ErrorCodes } from '@api/utils/errors';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { uploadImage } from '@api/services/media';

export const mediaRouter = new Hono().post('/image', authMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();

    const file = body.file;

    if (!file || !(file instanceof File)) {
      throw new AppError(new Error('No file provided'), ErrorCodes.VALIDATION_ERROR, 400);
    }

    const result = await uploadImage(file);

    return c.json({
      success: true,
      url: result.url,
      fileKey: result.fileKey,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    return handleError(c, error, 'Failed to upload image');
  }
});
