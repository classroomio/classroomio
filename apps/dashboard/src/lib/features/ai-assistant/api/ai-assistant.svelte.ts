import { BaseApiWithErrors, classroomio, apiClient, getRequestBaseUrl } from '$lib/utils/services/api';
import type {
  AgentConversation,
  AgentConversationCreateData,
  AgentConversationSummary,
  AgentStatusData,
  AiAssistantMessage,
  CompactConversationRequest,
  CompactConversationSuccess
} from '../utils/types';

class AiAssistantApi extends BaseApiWithErrors {
  status: AgentStatusData | null = $state(null);
  conversations: AgentConversationSummary[] = $state([]);
  currentConversation: AgentConversation | null = $state(null);

  async fetchStatus(courseId: string) {
    await this.execute<typeof classroomio.agent.status.$get>({
      requestFn: () =>
        classroomio.agent.status.$get({
          query: { courseId }
        }),
      logContext: 'fetching agent status',
      onSuccess: (result) => {
        this.status = result.data;
      }
    });
  }

  async listConversations(courseId: string) {
    await this.execute<typeof classroomio.agent.history.$get>({
      requestFn: () =>
        classroomio.agent.history.$get({
          query: { courseId }
        }),
      logContext: 'listing conversations',
      onSuccess: (result) => {
        this.conversations = result.data as AgentConversationSummary[];
      }
    });
  }

  async loadConversation(conversationId: string) {
    await this.execute<(typeof classroomio.agent.history)[':conversationId']['$get']>({
      requestFn: () =>
        classroomio.agent.history[':conversationId'].$get({
          param: { conversationId }
        }),
      logContext: 'loading conversation',
      onSuccess: (result) => {
        this.currentConversation = {
          ...(result.data as AgentConversation),
          messages: ((result.data as AgentConversation).messages ?? []) as AiAssistantMessage[]
        };
      }
    });
  }

  async createConversation(courseId: string, title?: string): Promise<{ id: string } | null> {
    let created: { id: string } | null = null;

    await this.execute<typeof classroomio.agent.history.$post>({
      requestFn: () =>
        classroomio.agent.history.$post({
          json: { courseId, title }
        }),
      logContext: 'creating conversation',
      onSuccess: (result) => {
        const newConversation = result.data as AgentConversationCreateData;
        created = newConversation;

        this.conversations = [
          { ...newConversation, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ...this.conversations
        ];
      }
    });

    return created;
  }

  async saveMessages(conversationId: string, messages: AiAssistantMessage[], title?: string) {
    await this.execute<(typeof classroomio.agent.history)[':conversationId']['$put']>({
      requestFn: () =>
        classroomio.agent.history[':conversationId'].$put({
          param: { conversationId },
          json: { messages, title }
        }),
      logContext: 'saving messages'
    });
  }

  async deleteConversation(conversationId: string) {
    await this.execute<(typeof classroomio.agent.history)[':conversationId']['$delete']>({
      requestFn: () =>
        classroomio.agent.history[':conversationId'].$delete({
          param: { conversationId }
        }),
      logContext: 'deleting conversation',
      onSuccess: () => {
        this.conversations = this.conversations.filter((c) => c.id !== conversationId);

        if (this.currentConversation?.id === conversationId) {
          this.currentConversation = null;
        }
      }
    });
  }

  async generateCourseMeta(prompt: string): Promise<{ title: string; description: string } | null> {
    let meta: { title: string; description: string } | null = null;

    await this.execute<(typeof classroomio.agent)['generate-course-title']['$post']>({
      requestFn: () =>
        classroomio.agent['generate-course-title'].$post({
          json: { prompt }
        }),
      logContext: 'generating course meta',
      onSuccess: (result) => {
        meta = (result as { data: { title: string; description: string } }).data;
      }
    });

    return meta;
  }

  async uploadDocument(
    file: File,
    courseId: string,
    conversationId: string
  ): Promise<{ documentId: string; fileName: string; wordCount: number; truncated: boolean } | null> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const url =
        `${getRequestBaseUrl()}/agent/upload` +
        `?courseId=${encodeURIComponent(courseId)}` +
        `&conversationId=${encodeURIComponent(conversationId)}`;

      const response = await apiClient.request(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: { documentId: string; fileName: string; wordCount: number; truncated: boolean };
      };

      if (result.success && result.data) {
        return result.data;
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      this.error = 'Failed to upload document';
    }

    return null;
  }

  async generateTitle(conversationId: string, firstMessageText: string): Promise<string | null> {
    let generatedTitle: string | null = null;

    await this.execute<(typeof classroomio.agent.history)[':conversationId']['generate-title']['$post']>({
      requestFn: () =>
        classroomio.agent.history[':conversationId']['generate-title'].$post({
          param: { conversationId },
          json: { firstMessageText }
        }),
      logContext: 'generating title',
      onSuccess: (result) => {
        generatedTitle = (result.data as { title: string }).title;

        // Update the title in the local conversations list
        this.conversations = this.conversations.map((c) =>
          c.id === conversationId ? { ...c, title: generatedTitle } : c
        );

        if (this.currentConversation?.id === conversationId) {
          this.currentConversation = { ...this.currentConversation, title: generatedTitle };
        }
      }
    });

    return generatedTitle;
  }

  async renameConversation(conversationId: string, title: string): Promise<string | null> {
    let newTitle: string | null = null;

    await this.execute<(typeof classroomio.agent.history)[':conversationId']['$patch']>({
      requestFn: () =>
        classroomio.agent.history[':conversationId'].$patch({
          param: { conversationId },
          json: { title }
        }),
      logContext: 'renaming conversation',
      onSuccess: (result) => {
        newTitle = (result.data as { id: string; title: string }).title;

        this.conversations = this.conversations.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c));

        if (this.currentConversation?.id === conversationId) {
          this.currentConversation = { ...this.currentConversation, title: newTitle };
        }
      }
    });

    return newTitle;
  }

  async summarizeConversation(messages: AiAssistantMessage[], courseId: string): Promise<string | null> {
    let summary: string | null = null;

    await this.execute<(typeof classroomio.agent)['summarize']['$post']>({
      requestFn: () =>
        classroomio.agent.summarize.$post({
          json: { messages, courseId }
        }),
      logContext: 'summarizing conversation',
      onSuccess: (result) => {
        summary = (result.data as { summary: string }).summary;
      }
    });

    return summary;
  }

  async compactConversation(conversationId: string): Promise<CompactConversationSuccess['data']['messages'] | null> {
    let compacted: CompactConversationSuccess['data']['messages'] | null = null;

    await this.execute<CompactConversationRequest>({
      requestFn: () =>
        classroomio.agent.history[':conversationId'].compact.$post({
          param: { conversationId }
        }),
      logContext: 'compacting conversation',
      onSuccess: (result) => {
        compacted = result.data.messages;

        if (this.currentConversation?.id === conversationId) {
          this.currentConversation = {
            ...this.currentConversation,
            messages: compacted as AiAssistantMessage[]
          };
        }
      }
    });

    return compacted;
  }
}

export const aiAssistantApi = new AiAssistantApi();
