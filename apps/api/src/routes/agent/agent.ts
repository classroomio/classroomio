import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { authOrApiKeyMiddleware } from '@api/middlewares/auth-or-api-key';
import { agentContentTypeRewrite } from '@api/middlewares/agent-content-type';
import { handleError, AppError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import {
  ZAgentChatBody,
  ZAgentCreditPurchase,
  ZAgentCreditsBody,
  ZAgentGenerateCourseTitleBody,
  ZAgentGenerateTextBody,
  ZAgentStatusQuery,
  ZAgentSummarizeBody,
  ZTutorUsageQuery,
  ZTutorUsagePeriod,
  ZTutorUsageUserParam
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
import {
  enforceStudentTutorPolicy,
  getStudentTutorStatus,
  getTutorCapStatusSummary,
  getTutorLearnerDetail,
  getTutorLearnerLeaderboard,
  incrementStudentTutorCount
} from '@api/services/agent/tutor-usage';
import { buildStudentAgentTools } from '@api/services/agent/student-tools';
import { parseAndStoreDocument } from '@api/services/agent/document';
import { recordCreditPurchase } from '@api/services/agent/credit-purchase';
import { generateCourseMeta } from '@api/services/agent/title-generation';
import { generateFieldText } from '@api/services/agent/text-generation';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getChatConversation } from '@cio/db/queries/agent';
import {
  AgentRole,
  AIProvider,
  MAX_STEPS_PER_ROUND,
  getCourseTemplate,
  type AgentContext,
  type AgentStatus
} from '@cio/ai-assistant';
import { createModel, getProviderConfigForProvider, pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { AGENT_MODELS, DEFAULT_PICKER_MODEL_ID } from '@cio/utils/agent-models';
import { buildSystemPrompt, buildContextMessage } from '@cio/ai-assistant/prompt';
import { trackAgentEvent, AgentEvent } from '@api/utils/tinybird';
import { redis } from '@api/utils/redis/redis';
import { db } from '@cio/db';
import * as schema from '@cio/db/schema';
import { eq } from 'drizzle-orm';
import { listCourseSections } from '@api/services/course/section';
import { getLesson } from '@api/services/lesson/lesson';
import { getExercise } from '@api/services/exercise/exercise';
import { sanitizeDanglingToolCalls } from '@api/services/agent/sanitize-tool-calls';
import {
  collectDocumentIds,
  getActiveCourseTemplateId,
  getLatestImplementationPlan,
  loadDocumentsText,
  verifyExerciseBelongsToCourse,
  verifyLessonBelongsToCourse
} from '@api/services/agent/chat-context';
import { buildAgentTools } from '@api/services/agent/chat-tools';
import { buildModelContextMessages } from '@api/services/agent/model-context';
import { summarizeConversation } from '@api/services/agent/summarize';
import { agentHistoryRouter } from './history';
import { agentRunsRouter } from './runs';

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
          usage: { used: 0, allowance: 0, creditBalance: 0, remaining: 0 },
          tutor: { enabled: false, capRemaining: null, cap: null, enforced: false }
        };

        return c.json({ success: true, data: status });
      }

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      const role = isTeamMember ? AgentRole.TEACHER : AgentRole.STUDENT;

      const usage = await getTokenBalance(orgId);

      const tutor =
        role === AgentRole.STUDENT
          ? await getStudentTutorStatus(orgId, courseId, user.id)
          : { enabled: true, cap: null, capRemaining: null, enforced: false };

      const status: AgentStatus = {
        enabled: true,
        role,
        usage,
        tutor
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
  .get(
    '/tutor-usage/leaderboard',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('query', ZTutorUsageQuery),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { period, search, sort, page, limit } = c.req.valid('query');
        const data = await getTutorLearnerLeaderboard(orgId, { period, search, sort, page, limit });

        return c.json({ success: true as const, data });
      } catch (error) {
        return handleError(c, error, 'Failed to fetch learner leaderboard');
      }
    }
  )
  .get(
    '/tutor-usage/summary',
    authMiddleware,
    orgMemberMiddleware,
    zValidator(
      'query',
      ZTutorUsagePeriod.optional()
        .transform((v) => v ?? 'current')
        .pipe(ZTutorUsagePeriod)
        .or(ZTutorUsagePeriod)
        .transform((v) => ({ period: v }))
    ),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const period = c.req.query('period');
        const parsed = ZTutorUsagePeriod.safeParse(period);
        const data = await getTutorCapStatusSummary(orgId, parsed.success ? parsed.data : 'current');

        return c.json({ success: true as const, data });
      } catch (error) {
        return handleError(c, error, 'Failed to fetch tutor cap summary');
      }
    }
  )
  .get(
    '/tutor-usage/:userId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZTutorUsageUserParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { userId } = c.req.valid('param');
        const period = c.req.query('period');
        const parsed = ZTutorUsagePeriod.safeParse(period);
        const data = await getTutorLearnerDetail(orgId, userId, parsed.success ? parsed.data : 'current');

        return c.json({ success: true as const, data });
      } catch (error) {
        return handleError(c, error, 'Failed to fetch learner detail');
      }
    }
  )
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
  .post(
    '/generate-text',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('json', ZAgentGenerateTextBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { prompt, tone, format, context, courseId } = c.req.valid('json');

        const providerConfig = pickAnyConfiguredProvider();

        if (!providerConfig) {
          throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
        }

        await enforceTokenBalance(orgId);

        const { text, usage, modelName } = await generateFieldText(prompt, tone, format, context, providerConfig);

        if (courseId) {
          await recordTokenUsage(orgId, user.id, courseId, usage, modelName);
        }

        return c.json({ success: true as const, data: { text } });
      } catch (error) {
        return handleError(c, error, 'Failed to generate text');
      }
    }
  )
  .post('/summarize', authMiddleware, orgMemberMiddleware, zValidator('json', ZAgentSummarizeBody), async (c) => {
    try {
      const { messages, courseId } = c.req.valid('json');
      const user = c.get('user')!;

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);

      if (!isTeamMember) {
        throw new AppError(
          'You must be a course team member to summarize conversations',
          'NOT_COURSE_TEAM_MEMBER',
          403
        );
      }

      const summary = await summarizeConversation({ messages });

      return c.json({ success: true as const, data: { summary } });
    } catch (error) {
      return handleError(c, error, 'Failed to summarize conversation');
    }
  })
  .post('/chat', authMiddleware, orgMemberMiddleware, zValidator('json', ZAgentChatBody), async (c) => {
    const user = c.get('user')!;
    const orgId = c.req.header('cio-org-id')!;

    try {
      const { courseId, conversationId, messages, context, model: requestedModel } = c.req.valid('json');

      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      const role = isTeamMember ? AgentRole.TEACHER : AgentRole.STUDENT;

      // Students always use the platform default; admins can pick. Forcing the
      // default avoids exposing premium models to learners and keeps per-message
      // cost predictable for fair-use accounting.
      const modelId =
        role === AgentRole.STUDENT ? DEFAULT_PICKER_MODEL_ID : (requestedModel ?? DEFAULT_PICKER_MODEL_ID);
      const modelDescriptor = AGENT_MODELS[modelId];
      const baseProviderConfig = getProviderConfigForProvider(modelDescriptor.provider as AIProvider);

      if (!baseProviderConfig) {
        throw new AppError(`AI assistant is not configured for model "${modelId}"`, 'AI_NOT_CONFIGURED', 503);
      }

      const providerConfig = { ...baseProviderConfig, model: modelDescriptor.backendModelId };

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

      if (conversationId) {
        const conversation = await getChatConversation(conversationId, user.id);

        if (!conversation || conversation.courseId !== courseId) {
          throw new AppError('Conversation not found for this course', 'CONVERSATION_NOT_FOUND', 404);
        }
      }

      const isOrgPaid = role === AgentRole.TEACHER ? await isOrgOnPaidPlan(orgId) : false;

      if (role === AgentRole.TEACHER && !modelDescriptor.isFree && !isOrgPaid) {
        throw new AppError('Upgrade required to use this AI model', 'UPGRADE_REQUIRED', 403);
      }

      // Students go through tutor policy (workspace toggle, pool, per-learner cap).
      // Teachers continue to use the existing pool-only check.
      const studentPolicy =
        role === AgentRole.STUDENT ? await enforceStudentTutorPolicy(orgId, courseId, user.id) : null;

      if (role === AgentRole.TEACHER) {
        await enforceTokenBalance(orgId);
      }

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
      const approvedPlan = role === AgentRole.TEACHER ? getLatestImplementationPlan(messages) : undefined;
      const activeTemplateId = role === AgentRole.TEACHER ? getActiveCourseTemplateId(messages) : undefined;
      const activeTemplate = activeTemplateId ? getCourseTemplate(activeTemplateId) : undefined;

      // Stable across requests — safe to cache as a long-lived Anthropic prefix.
      // Volatile per-request context (lesson/exercise/document/section count/
      // approved plan/active template) is sent as a user-turn message instead so
      // it doesn't invalidate the tools+system cache.
      const systemPrompt = buildSystemPrompt(agentContext, {
        tutorSettings: studentPolicy?.settings,
        isOrgOnPaidPlan: isOrgPaid
      });

      const contextMessageText = buildContextMessage(agentContext, {
        template: activeTemplate,
        approvedPlan
      });

      const agentTools =
        role === AgentRole.STUDENT
          ? buildStudentAgentTools(orgId, user.id, courseId, studentPolicy!.settings)
          : buildAgentTools(orgId, user.id, courseId, messages, { isOrgOnPaidPlan: isOrgPaid });

      const contextManaged = await buildModelContextMessages({
        conversationId,
        courseId,
        userId: user.id,
        messages
      });
      const convertedMessages = sanitizeDanglingToolCalls(await convertToModelMessages(contextManaged.messages as any));
      let completedStepCount = 0;
      let finishReason: string | undefined;

      const isAnthropic = providerConfig.provider === AIProvider.ANTHROPIC;

      // 1h TTL keeps the prefix warm across tool-execution gaps in long agent
      // runs. Break-even is 3 requests within the hour; well under most plan-
      // execution loops.
      const systemContent = isAnthropic
        ? {
            role: 'system' as const,
            content: systemPrompt,
            providerOptions: {
              anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } }
            }
          }
        : systemPrompt;

      // Prepend volatile context as a user-turn message so the stable system +
      // tools prefix stays cacheable even when the teacher navigates to a
      // different lesson or the agent creates sections mid-run.
      const modelMessages =
        contextMessageText.length > 0
          ? [
              { role: 'user' as const, content: [{ type: 'text' as const, text: contextMessageText }] },
              ...convertedMessages
            ]
          : convertedMessages;

      console.log(`[agent.chat] user=${user.id} messages=${modelMessages.length}`);

      // Cache the growing conversation prefix: each turn reads the prior
      // transcript at ~0.1x cost instead of reprocessing it at full price.
      if (isAnthropic && modelMessages.length > 0) {
        const lastMessage = modelMessages[modelMessages.length - 1];
        const existingAnthropic = (lastMessage.providerOptions?.anthropic as Record<string, unknown> | undefined) ?? {};
        lastMessage.providerOptions = {
          ...(lastMessage.providerOptions ?? {}),
          anthropic: {
            ...existingAnthropic,
            cacheControl: { type: 'ephemeral', ttl: '1h' }
          }
        };
      }

      const result = streamText({
        model,
        maxRetries: 2,
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

          // Cache hit/miss visibility. If cacheRead stays 0 across repeated
          // turns of the same conversation, a silent invalidator is leaking
          // into the cached prefix — audit system prompt and tool definitions.
          if (isAnthropic) {
            const details = totalUsage?.inputTokenDetails;
            const cacheRead = details?.cacheReadTokens ?? 0;
            const cacheWrite = details?.cacheWriteTokens ?? 0;
            const uncached = details?.noCacheTokens ?? inputTokens;
            const total = uncached + cacheRead + cacheWrite;
            const hitRate = total > 0 ? Math.round((cacheRead / total) * 100) : 0;
            console.log(
              `[agent.chat] cache hit=${hitRate}% read=${cacheRead} write=${cacheWrite} uncached=${uncached} output=${outputTokens}`
            );
          }

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

          if (role === AgentRole.STUDENT) {
            await incrementStudentTutorCount(orgId, user.id, courseId);
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

export const agentRouter = new Hono()
  .use('*', agentContentTypeRewrite)
  .route('/', agentCoreRouter)
  .route('/history', agentHistoryRouter)
  .route('/runs', agentRunsRouter);
