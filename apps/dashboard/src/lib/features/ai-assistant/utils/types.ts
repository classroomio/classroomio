import type { UIMessage } from 'ai';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type { CourseTemplateId } from '@cio/ai-assistant';

export interface UploadedDocument {
  id: string;
  name: string;
}

export interface AiAssistantMessageAttachment {
  documentId: string;
  name: string;
}

export interface AiAssistantMessageTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiAssistantMessageContinuation {
  reason: 'step_limit';
  maxSteps: number;
  finishReason?: string;
}

export type AiAssistantTemplateMetadata =
  | { id: CourseTemplateId }
  | { action: 'submit_template_answers'; templateId: CourseTemplateId; answers: Record<string, string> }
  | { action: 'skip_template_form'; templateId: CourseTemplateId };

export interface AiAssistantCompactionMetadata {
  compactedAt: string;
  originalMessageCount: number;
}

export type AiAssistantRunSummaryStatus = 'completed' | 'failed' | 'canceled' | 'paused';

/**
 * Per-item action describing what the agent did to a lesson or exercise.
 * `questions_added` / `questions_updated` carry counts; the rest are atomic
 * flags that dedupe by `kind` when aggregating multiple tool calls against
 * the same target.
 */
export type RunChangeAction =
  | { kind: 'created' }
  | { kind: 'metadata_updated' }
  | { kind: 'content_written' }
  | { kind: 'questions_added'; count: number }
  | { kind: 'questions_updated'; count: number }
  | { kind: 'section_added' }
  | { kind: 'section_edited' };

export interface RunChangedItem {
  targetType: 'lesson' | 'exercise';
  targetId: string;
  title: string;
  /** Aggregated actions; `questions_*` counts accumulate. */
  actions: RunChangeAction[];
  tokens?: number;
}

/**
 * Marks an assistant message as the terminal summary of a durable run.
 * Used to (1) render the summary card and (2) prevent duplicate injection
 * after a refresh when the message is already persisted in the conversation.
 */
export interface AiAssistantRunSummaryMetadata {
  runId: string;
  status: AiAssistantRunSummaryStatus;
  counts: {
    sections?: number;
    lessons?: number;
    exercises?: number;
    questionBlocks?: number;
  };
  /** Per-item changes for the top-of-chat ChangesCard; empty array means no lesson/exercise touched. */
  changes?: RunChangedItem[];
  finishedAt: string;
  error?: string;
}

export interface AiAssistantMessageMetadata {
  attachment?: AiAssistantMessageAttachment;
  tokenUsage?: AiAssistantMessageTokenUsage;
  continuation?: AiAssistantMessageContinuation;
  template?: AiAssistantTemplateMetadata;
  compaction?: AiAssistantCompactionMetadata;
  runSummary?: AiAssistantRunSummaryMetadata;
}

export type AiAssistantMessage = UIMessage<AiAssistantMessageMetadata>;

export type AgentStatusRequest = typeof classroomio.agent.status.$get;
export type AgentStatusSuccess = Extract<InferResponseType<AgentStatusRequest>, { success: true }>;
export type AgentStatusData = AgentStatusSuccess['data'];

export type AgentUsageRequest = typeof classroomio.agent.usage.$get;
export type AgentUsageSuccess = Extract<InferResponseType<AgentUsageRequest>, { success: true }>;
export type AgentUsageData = AgentUsageSuccess['data'];

export type AgentHistoryGetRequest = typeof classroomio.agent.history.$get;
export type AgentHistoryGetSuccess = Extract<InferResponseType<AgentHistoryGetRequest>, { success: true }>;
export type AgentHistoryData = AgentHistoryGetSuccess['data'];

export type AgentConversationSummary = AgentHistoryData[number];

export type AgentConversationRequest = (typeof classroomio.agent.history)[':conversationId']['$get'];
export type AgentConversationSuccess = Extract<InferResponseType<AgentConversationRequest>, { success: true }>;
export type AgentConversation = Omit<AgentConversationSuccess['data'], 'messages'> & {
  messages: AiAssistantMessage[];
};

export type AgentConversationCreateRequest = typeof classroomio.agent.history.$post;
export type AgentConversationCreateSuccess = Extract<
  InferResponseType<AgentConversationCreateRequest>,
  { success: true }
>;
export type AgentConversationCreateData = AgentConversationCreateSuccess['data'];

export type AgentHistorySaveRequest = (typeof classroomio.agent.history)[':conversationId']['$put'];

export type AgentHistoryRenameRequest = (typeof classroomio.agent.history)[':conversationId']['$patch'];

export type AgentHistoryDeleteRequest = (typeof classroomio.agent.history)[':conversationId']['$delete'];

export type CompactConversationRequest = (typeof classroomio.agent.history)[':conversationId']['compact']['$post'];
export type CompactConversationSuccess = Extract<InferResponseType<CompactConversationRequest>, { success: true }>;

export type GenerateCourseTitleRequest = (typeof classroomio.agent)['generate-course-title']['$post'];
export type GenerateCourseTitleSuccess = Extract<InferResponseType<GenerateCourseTitleRequest>, { success: true }>;
export type GenerateCourseTitleData = GenerateCourseTitleSuccess['data'];

export type AgentRunsListRequest = typeof classroomio.agent.runs.$get;
export type AgentRunsListSuccess = Extract<InferResponseType<AgentRunsListRequest>, { success: true }>;
export type AgentRunsListData = AgentRunsListSuccess['data'];
export type AgentRunSummary = AgentRunsListData[number];

export type AgentRunCreateRequest = typeof classroomio.agent.runs.$post;
export type AgentRunCreateSuccess = Extract<InferResponseType<AgentRunCreateRequest>, { success: true }>;
export type AgentRunDetail = AgentRunCreateSuccess['data'];
export type AgentRun = AgentRunDetail['run'];
export type AgentRunStep = AgentRunDetail['steps'][number];
export type AgentRunEvent = AgentRunDetail['events'][number];

export type AgentRunGetRequest = (typeof classroomio.agent.runs)[':runId']['$get'];
export type AgentRunCancelRequest = (typeof classroomio.agent.runs)[':runId']['cancel']['$post'];
export type AgentRunRetryRequest = (typeof classroomio.agent.runs)[':runId']['retry']['$post'];
export type AgentRunResumeRequest = (typeof classroomio.agent.runs)[':runId']['resume']['$post'];
