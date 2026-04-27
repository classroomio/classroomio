import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError, AppError } from '@api/utils/errors';
import { parseAndStoreDocument } from '@api/services/agent/document';
import { isOrgOnPaidPlan } from '@api/services/agent/usage';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getChatConversation } from '@cio/db/queries/agent';
import { redis } from '@api/utils/redis/redis';

/**
 * POST /agent/upload
 * Upload a PDF, DOCX, or PPTX file for AI-powered course plan generation.
 * EARLY_ADOPTER+ plan required. Max 5MB.
 */
export const agentUploadRouter = new Hono().post('/upload', authMiddleware, orgMemberMiddleware, async (c) => {
  try {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id')!;

    const courseId = c.req.query('courseId');
    if (!courseId) {
      throw new AppError('Course ID is required', 'COURSE_ID_REQUIRED', 400);
    }

    const conversationId = c.req.query('conversationId');
    if (!conversationId) {
      throw new AppError('Conversation ID is required', 'CONVERSATION_ID_REQUIRED', 400);
    }

    // Verify course team membership
    const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
    if (!isTeamMember) {
      throw new AppError('You must be a course team member to upload documents', 'NOT_COURSE_TEAM_MEMBER', 403);
    }

    // Verify the conversation exists and belongs to this user + course
    const conversation = await getChatConversation(conversationId, user.id);
    if (!conversation || conversation.courseId !== courseId) {
      throw new AppError('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    // Plan gate — EARLY_ADOPTER+ required
    const isPaid = await isOrgOnPaidPlan(orgId);
    if (!isPaid) {
      return c.json(
        {
          success: false,
          error: 'document_upload_requires_upgrade',
          upgradeRequired: true
        },
        403
      );
    }

    // Parse multipart body
    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      throw new AppError('File is required', 'FILE_REQUIRED', 400);
    }

    const result = await parseAndStoreDocument(file, orgId, user.id, courseId, conversationId, redis);

    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.statusCode === 413) {
        return c.json({ success: false, error: 'file_too_large', maxSize: 5242880 }, 413);
      }

      if (error.statusCode === 415) {
        return c.json(
          {
            success: false,
            error: 'unsupported_file_type',
            allowed: [
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ]
          },
          415
        );
      }
    }

    return handleError(c, error, 'Failed to upload document');
  }
});
