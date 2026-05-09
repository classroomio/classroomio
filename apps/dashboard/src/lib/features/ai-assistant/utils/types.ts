import type { UIMessage } from 'ai';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

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

export interface AiAssistantMessageMetadata {
  attachment?: AiAssistantMessageAttachment;
  tokenUsage?: AiAssistantMessageTokenUsage;
  continuation?: AiAssistantMessageContinuation;
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

export type AgentHistoryDeleteRequest = (typeof classroomio.agent.history)[':conversationId']['$delete'];

export type GenerateCourseTitleRequest = (typeof classroomio.agent)['generate-course-title']['$post'];
export type GenerateCourseTitleSuccess = Extract<InferResponseType<GenerateCourseTitleRequest>, { success: true }>;
export type GenerateCourseTitleData = GenerateCourseTitleSuccess['data'];
