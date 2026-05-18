import { z } from 'zod';
import { AGENT_MODEL_IDS } from '../../agent-models';

const ZAgentCourseId = z.string().min(1);

// ─── POST /agent/chat ────────────────────────────────────────────────────────

export const ZAgentChatBody = z.object({
  courseId: ZAgentCourseId,
  messages: z.array(z.any()), // UIMessage[] from Vercel AI SDK — validated by the SDK itself
  model: z.enum(AGENT_MODEL_IDS).optional(),
  context: z
    .object({
      lessonId: z.string().uuid().optional(),
      exerciseId: z.string().uuid().optional(),
      documentId: z.string().optional()
    })
    .optional()
});

export type TAgentChatBody = z.infer<typeof ZAgentChatBody>;

// ─── POST /agent/upload ──────────────────────────────────────────────────────

export const ZAgentUploadQuery = z.object({
  courseId: ZAgentCourseId,
  conversationId: z.string().uuid()
});

export type TAgentUploadQuery = z.infer<typeof ZAgentUploadQuery>;

// ─── GET /agent/status ───────────────────────────────────────────────────────

export const ZAgentStatusQuery = z.object({
  courseId: ZAgentCourseId
});

export type TAgentStatusQuery = z.infer<typeof ZAgentStatusQuery>;

// ─── POST /agent/credits ─────────────────────────────────────────────────────

export const ZAgentCreditsBody = z.object({
  amount: z.number().int().min(1)
});

export type TAgentCreditsBody = z.infer<typeof ZAgentCreditsBody>;

export const ZAgentCreditPurchase = z.object({
  orgId: z.string().uuid(),
  triggeredBy: z.string().uuid().optional(),
  providerOrderId: z.string().min(1),
  tokens: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
  payload: z.record(z.string(), z.unknown()).optional()
});

export type TAgentCreditPurchase = z.infer<typeof ZAgentCreditPurchase>;

// ─── Supported MIME types ────────────────────────────────────────────────────

export const SUPPORTED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
] as const;

export const MAX_AGENT_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

// ─── GET /agent/history (list conversations) ────────────────────────────────

export const ZAgentHistoryQuery = z.object({
  courseId: ZAgentCourseId
});

export type TAgentHistoryQuery = z.infer<typeof ZAgentHistoryQuery>;

// ─── GET /agent/history/:conversationId ──────────────────────────────────────

export const ZAgentConversationParam = z.object({
  conversationId: z.string().uuid()
});

export type TAgentConversationParam = z.infer<typeof ZAgentConversationParam>;

// ─── POST /agent/history (create conversation) ──────────────────────────────

export const ZAgentConversationCreateBody = z.object({
  courseId: ZAgentCourseId,
  title: z.string().optional()
});

export type TAgentConversationCreateBody = z.infer<typeof ZAgentConversationCreateBody>;

// ─── PUT /agent/history/:conversationId (save messages) ──────────────────────

export const ZAgentHistorySaveBody = z.object({
  messages: z.array(z.any()),
  title: z.string().optional()
});

export type TAgentHistorySaveBody = z.infer<typeof ZAgentHistorySaveBody>;

// ─── PATCH /agent/history/:conversationId (rename only) ────────────────────

export const ZAgentHistoryRenameBody = z.object({
  title: z.string().min(1).max(120)
});

export type TAgentHistoryRenameBody = z.infer<typeof ZAgentHistoryRenameBody>;

// ─── DELETE /agent/history/:conversationId ───────────────────────────────────

export const ZAgentHistoryDeleteParam = z.object({
  conversationId: z.string().uuid()
});

export type TAgentHistoryDeleteParam = z.infer<typeof ZAgentHistoryDeleteParam>;

// ─── POST /agent/history/:conversationId/generate-title ──────────────────────

export const ZAgentGenerateTitleParam = z.object({
  conversationId: z.string().uuid()
});

export const ZAgentGenerateTitleBody = z.object({
  firstMessageText: z.string().min(1).max(500)
});

export type TAgentGenerateTitleParam = z.infer<typeof ZAgentGenerateTitleParam>;
export type TAgentGenerateTitleBody = z.infer<typeof ZAgentGenerateTitleBody>;

// ─── POST /agent/generate-course-title ───────────────────────────────────────

export const ZAgentGenerateCourseTitleBody = z.object({
  prompt: z.string().min(1).max(2000)
});

export type TAgentGenerateCourseTitleBody = z.infer<typeof ZAgentGenerateCourseTitleBody>;

// ─── POST /agent/summarize ────────────────────────────────────────────────────

export const ZAgentSummarizeBody = z.object({
  messages: z.array(z.any()),
  courseId: ZAgentCourseId
});

export type TAgentSummarizeBody = z.infer<typeof ZAgentSummarizeBody>;

// ─── POST /agent/generate-text ───────────────────────────────────────────────

export const ZAgentGenerateTextBody = z.object({
  prompt: z.string().min(1).max(1000),
  tone: z.enum(['professional', 'casual', 'expert', 'friendly']),
  format: z.enum(['plain', 'html']).default('plain'),
  context: z.string().max(500).optional(),
  courseId: z.string().uuid().optional()
});

export type TAgentGenerateTextBody = z.infer<typeof ZAgentGenerateTextBody>;
