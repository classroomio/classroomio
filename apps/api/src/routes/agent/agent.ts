import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { handleError, AppError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import {
  ZAgentChatBody,
  ZAgentCreditPurchase,
  ZAgentCreditsBody,
  ZAgentGenerateCourseTitleBody,
  ZAgentStatusQuery
} from '@cio/utils/validation/agent';
import {
  addCredits,
  enforceTokenBalance,
  getDetailedUsage,
  getPurchasedSummary,
  getTeamLeaderboard,
  getTokenBalance,
  isOrgOnPaidPlan,
  recordTokenUsage
} from '@api/services/agent/usage';
import { parseAndStoreDocument } from '@api/services/agent/document';
import { recordCreditPurchase } from '@api/services/agent/credit-purchase';
import { generateCourseMeta } from '@api/services/agent/title-generation';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getChatConversation } from '@cio/db/queries/agent';
import { AgentRole, AIProvider, MAX_STEPS_PER_ROUND, type AgentContext, type AgentStatus } from '@cio/ai-assistant';
import { createModel, getProviderConfigForProvider, pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { AGENT_MODELS, DEFAULT_PICKER_MODEL_ID } from '@cio/utils/agent-models';
import { buildSystemPrompt } from '@cio/ai-assistant/prompt';
import { trackAgentEvent, AgentEvent } from '@api/utils/tinybird';
import { redis } from '@api/utils/redis/redis';
import { db } from '@cio/db';
import * as schema from '@cio/db/schema';
import { eq } from 'drizzle-orm';
import { listCourseSections } from '@api/services/course/section';
import { getLesson } from '@api/services/lesson/lesson';
import { getExercise } from '@api/services/exercise/exercise';
import { trimMessageHistory } from '@api/services/agent/context-window';
import {
  collectDocumentIds,
  getLatestImplementationPlan,
  loadDocumentsText,
  verifyExerciseBelongsToCourse,
  verifyLessonBelongsToCourse
} from '@api/services/agent/chat-context';
import { buildAgentTools } from '@api/services/agent/chat-tools';
import { agentHistoryRouter } from './history';

const agentCoreRouter = new Hono()
  .get('/status', authMiddleware, orgMemberMiddleware, zValidator('query', ZAgentStatusQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { courseId } = c.req.valid('query');

      const providerConfig = pickAnyConfiguredProvider();
      if (!providerConfig) {
        const status: AgentStatus = {
          enabled: false,
          role: AgentRole.STUDENT,
          usage: { used: 0, allowance: 0, creditBalance: 0, remaining: 0 }
        };

        return c.json({ success: true, data: status });
      }

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      const role = isTeamMember ? AgentRole.TEACHER : AgentRole.STUDENT;

      const usage = await getTokenBalance(orgId);

      const status: AgentStatus = {
        enabled: true,
        role,
        usage
      };

      return c.json({ success: true, data: status });
    } catch (error) {
      return handleError(c, error, 'Failed to get agent status');
    }
  })
  .post('/upload', authMiddleware, orgMemberMiddleware, async (c) => {
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

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      if (!isTeamMember) {
        throw new AppError('You must be a course team member to upload documents', 'NOT_COURSE_TEAM_MEMBER', 403);
      }

      const conversation = await getChatConversation(conversationId, user.id);
      if (!conversation || conversation.courseId !== courseId) {
        throw new AppError('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
      }

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
  })
  .get('/usage/purchased', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await getPurchasedSummary(orgId);

      return c.json({ success: true, data });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch purchased summary');
    }
  })
  .get('/usage/leaderboard', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await getTeamLeaderboard(orgId);

      return c.json({ success: true, data });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch leaderboard');
    }
  })
  .get('/usage', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const usage = await getDetailedUsage(orgId);

      return c.json({ success: true, data: usage });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch usage stats');
    }
  })
  .post('/credits', authMiddleware, orgAdminMiddleware, zValidator('json', ZAgentCreditsBody), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { amount } = c.req.valid('json');

      await addCredits(orgId, amount);
      const balance = await getTokenBalance(orgId);

      return c.json({ success: true, data: balance });
    } catch (error) {
      return handleError(c, error, 'Failed to purchase credits');
    }
  })
  .post('/credits/purchase', authOrApiKeyMiddleware, zValidator('json', ZAgentCreditPurchase), async (c) => {
    try {
      const body = c.req.valid('json');
      const purchase = await recordCreditPurchase(body);

      return c.json({ success: true, data: purchase });
    } catch (error) {
      return handleError(c, error, 'Failed to record credit purchase');
    }
  })
  .post(
    '/generate-course-title',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZAgentGenerateCourseTitleBody),
    async (c) => {
      try {
        const { prompt } = c.req.valid('json');

        const providerConfig = pickAnyConfiguredProvider();

        if (!providerConfig) {
          throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
        }

        const meta = await generateCourseMeta(prompt, providerConfig);

        return c.json({ success: true as const, data: meta });
      } catch (error) {
        return handleError(c, error, 'Failed to generate course title');
      }
    }
  )
  .post('/chat', authMiddleware, orgMemberMiddleware, zValidator('json', ZAgentChatBody), async (c) => {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id')!;

    try {
      const { courseId, messages, context, model: requestedModel } = c.req.valid('json');

      const modelId = requestedModel ?? DEFAULT_PICKER_MODEL_ID;
      const modelDescriptor = AGENT_MODELS[modelId];
      const baseProviderConfig = getProviderConfigForProvider(modelDescriptor.provider as AIProvider);

      if (!baseProviderConfig) {
        throw new AppError(`AI assistant is not configured for model "${modelId}"`, 'AI_NOT_CONFIGURED', 503);
      }

      const providerConfig = { ...baseProviderConfig, model: modelDescriptor.backendModelId };

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      const role = isTeamMember ? AgentRole.TEACHER : AgentRole.STUDENT;

      if (role === AgentRole.STUDENT) {
        throw new AppError('AI assistant is not available for students yet', 'STUDENT_NOT_SUPPORTED', 403);
      }

      const [courseRow] = await db
        .select({
          title: schema.course.title,
          description: schema.course.description,
          organizationId: schema.group.organizationId
        })
        .from(schema.course)
        .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
        .where(eq(schema.course.id, courseId))
        .limit(1);

      if (!courseRow) {
        throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
      }

      if (courseRow.organizationId !== orgId) {
        throw new AppError('Course does not belong to this organization', 'COURSE_ORG_MISMATCH', 403);
      }

      if (!modelDescriptor.isFree) {
        const isPaid = await isOrgOnPaidPlan(orgId);

        if (!isPaid) {
          throw new AppError('Upgrade required to use this AI model', 'UPGRADE_REQUIRED', 403);
        }
      }

      await enforceTokenBalance(orgId);

      const documentIds = collectDocumentIds(messages, context?.documentId);
      const documentText = documentIds.length > 0 ? await loadDocumentsText(documentIds, user.id) : undefined;

      const existingSections = await listCourseSections(courseId);

      let lessonTitle: string | undefined;
      let lessonContent: string | undefined;
      if (context?.lessonId) {
        try {
          await verifyLessonBelongsToCourse(context.lessonId, courseId);
          const lesson = await getLesson(context.lessonId);
          lessonTitle = lesson.title;
          const lessonWithLangs = lesson as {
            lessonLanguages?: Array<{ locale: string; content: string | null }>;
          };
          const langContent = lessonWithLangs.lessonLanguages?.find((ll) => ll.locale === 'en');
          lessonContent = langContent?.content || undefined;
        } catch {
          // Lesson not found or doesn't belong — continue without lesson context
        }
      }

      let exerciseTitle: string | undefined;
      if (context?.exerciseId) {
        try {
          await verifyExerciseBelongsToCourse(context.exerciseId, courseId);
          const exercise = await getExercise(context.exerciseId);
          exerciseTitle = exercise.title;
        } catch {
          // Exercise not found or doesn't belong — continue without exercise context
        }
      }

      const agentContext: AgentContext = {
        orgId,
        courseId,
        courseTitle: courseRow.title,
        courseDescription: courseRow.description || undefined,
        userId: user.id,
        role,
        locale: 'en',
        lessonId: context?.lessonId,
        lessonTitle,
        lessonContent,
        exerciseId: context?.exerciseId,
        exerciseTitle,
        documentId: context?.documentId,
        documentText,
        existingSectionCount: existingSections.length
      };

      trackAgentEvent(AgentEvent.CHAT_STARTED, {
        orgId,
        userId: user.id,
        courseId,
        role,
        hasDocument: !!documentText,
        messageCount: messages.length
      });

      const startTime = Date.now();
      const model = createModel(providerConfig);
      const approvedPlan = getLatestImplementationPlan(messages);
      const systemPrompt = [
        buildSystemPrompt(agentContext),
        approvedPlan
          ? [
              '',
              'The latest user message approved a final course plan for immediate execution.',
              'Implement that exact plan directly without asking the user to restate it.',
              'Treat this approved plan as the canonical source if it differs from any earlier draft.',
              `Approved plan JSON:\n${JSON.stringify(approvedPlan, null, 2)}`
            ].join('\n')
          : ''
      ].join('\n');
      const agentTools = buildAgentTools(orgId, user.id, courseId);

      const trimmedMessages = trimMessageHistory(messages);
      const modelMessages = await convertToModelMessages(trimmedMessages);
      let completedStepCount = 0;
      let finishReason: string | undefined;

      const isAnthropic = providerConfig.provider === AIProvider.ANTHROPIC;
      const systemContent = isAnthropic
        ? {
            role: 'system' as const,
            content: systemPrompt,
            providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } }
          }
        : systemPrompt;

      const result = streamText({
        model,
        maxRetries: 0,
        system: systemContent,
        messages: modelMessages,
        tools: agentTools,
        stopWhen: stepCountIs(MAX_STEPS_PER_ROUND),
        onStepFinish: () => {
          completedStepCount += 1;
        },
        onFinish: async ({ totalUsage, finishReason: resultFinishReason, steps }) => {
          completedStepCount = steps.length;
          finishReason = resultFinishReason;
          const durationMs = Date.now() - startTime;
          const inputTokens = totalUsage?.inputTokens ?? 0;
          const outputTokens = totalUsage?.outputTokens ?? 0;

          if (totalUsage) {
            await recordTokenUsage(
              orgId,
              user.id,
              courseId,
              {
                promptTokens: inputTokens,
                completionTokens: outputTokens,
                totalTokens: inputTokens + outputTokens
              },
              providerConfig.model || providerConfig.provider
            );
          }

          trackAgentEvent(AgentEvent.CHAT_COMPLETED, {
            orgId,
            userId: user.id,
            courseId,
            inputTokens,
            outputTokens,
            model: providerConfig.model || providerConfig.provider,
            durationMs
          });
        }
      });

      return result.toUIMessageStreamResponse({
        messageMetadata: ({ part }) => {
          if (part.type !== 'finish') {
            return undefined;
          }

          return {
            tokenUsage: {
              promptTokens: part.totalUsage.inputTokens,
              completionTokens: part.totalUsage.outputTokens,
              totalTokens: part.totalUsage.totalTokens
            },
            continuation:
              completedStepCount >= MAX_STEPS_PER_ROUND
                ? {
                    reason: 'step_limit' as const,
                    maxSteps: MAX_STEPS_PER_ROUND,
                    finishReason
                  }
                : undefined
          };
        }
      });
    } catch (error) {
      trackAgentEvent(AgentEvent.CHAT_ERROR, {
        orgId,
        userId: user?.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof AppError) {
        return c.json({ success: false, error: error.message, code: error.code }, error.statusCode);
      }

      console.error('Agent chat error:', error);
      return c.json({ success: false, error: 'Failed to process chat message', code: 'INTERNAL_ERROR' }, 500);
    }
  });

export const agentRouter = new Hono().route('/', agentCoreRouter).route('/history', agentHistoryRouter);
