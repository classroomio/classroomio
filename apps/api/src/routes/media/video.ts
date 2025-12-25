import { AppError, ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { videoProcessingQueue } from '@api/services/video/queue';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';

const ProcessVideoSchema = z.object({
  fileKey: z.string().min(1, 'File key is required'),
  language: z.string().optional(),
  lessonId: z.string().optional(),
});

const VideoProcessResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    jobId: { type: 'string' as const },
    status: { type: 'string' as const },
    message: { type: 'string' as const },
  },
  required: ['success', 'jobId', 'status', 'message'],
};

const VideoStatusResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    jobId: { type: 'string' as const },
    status: { type: 'string' as const },
    progress: { type: 'number' as const },
    result: { type: 'object' as const },
    failedReason: { type: 'string' as const },
  },
  required: ['success', 'jobId', 'status', 'progress'],
};

export const videoRouter = new Hono()
  .post(
    '/process',
    authMiddleware,
    describeRoute({
      description: 'Start video processing (HLS encoding and caption generation)',
      responses: {
        200: {
          description: 'Video processing started successfully',
          content: {
            'application/json': {
              schema: VideoProcessResponse,
            },
          },
        },
        400: {
          description: 'Invalid request body',
        },
        401: {
          description: 'Unauthorized',
        },
      },
      tags: ['Media'],
    }),
    validator('json', ProcessVideoSchema),
    async (c) => {
      try {
        const body = c.req.valid('json');
        const user = c.get('user');

        if (!user) {
          throw new AppError(new Error('Unauthorized'), ErrorCodes.AUTH_ERROR, 401);
        }

        // Add job to queue
        const job = await videoProcessingQueue.add(
          'encode-video',
          {
            fileKey: body.fileKey,
            userId: user.id,
            language: body.language,
            lessonId: body.lessonId,
          },
          {
            priority: 1,
            jobId: `video-${body.fileKey}`, // Prevent duplicates
          }
        );

        return c.json({
          success: true,
          jobId: job.id,
          status: 'queued',
          message: 'Video processing started',
        });
      } catch (error) {
        return handleError(c, error, 'Failed to start video processing');
      }
    }
  )
  .get(
    '/status/:jobId',
    authMiddleware,
    describeRoute({
      description: 'Get video processing status',
      responses: {
        200: {
          description: 'Processing status retrieved successfully',
          content: {
            'application/json': {
              schema: VideoStatusResponse,
            },
          },
        },
        404: {
          description: 'Job not found',
        },
        401: {
          description: 'Unauthorized',
        },
      },
      tags: ['Media'],
    }),
    async (c) => {
      try {
        const jobId = c.req.param('jobId');
        const user = c.get('user');

        if (!user) {
          throw new AppError(new Error('Unauthorized'), ErrorCodes.AUTH_ERROR, 401);
        }

        const job = await videoProcessingQueue.getJob(jobId);

        if (!job) {
          return c.json({ success: false, error: 'Job not found' }, 404);
        }

        const state = await job.getState();
        const progress = job.progress || 0;

        return c.json({
          success: true,
          jobId: job.id,
          status: state,
          progress: typeof progress === 'number' ? progress : 0,
          result: job.returnvalue || null,
          failedReason: job.failedReason || null,
        });
      } catch (error) {
        return handleError(c, error, 'Failed to get processing status');
      }
    }
  );
