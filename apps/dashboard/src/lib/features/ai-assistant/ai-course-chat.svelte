<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import ChatHeader from '$features/ai-assistant/chat-header.svelte';
  import ChatMessageList from '$features/ai-assistant/chat-message-list.svelte';
  import ChatInput from '$features/ai-assistant/chat-input.svelte';
  import RunMonitorPane from '$features/ai-assistant/run-monitor-pane.svelte';
  import ChatChangesCard from '$features/ai-assistant/chat-changes-card.svelte';
  import {
    buildRunSummaryMetadata,
    extractChangedItems,
    extractChangedItemsFromMessages,
    formatRunSummaryCounts,
    type ExerciseTitleLookup
  } from '$features/ai-assistant/utils/run-summary';
  import type { AiAssistantRunSummaryMetadata, RunChangedItem } from '$features/ai-assistant/utils/types';
  import { resolve } from '$app/paths';
  import { getCompletedToolLine, getPendingToolLine, MUTATION_TOOLS } from '$features/ai-assistant/utils/tool-labels';
  import type { ProgressStep, ToolLineUi } from '$features/ai-assistant/utils/tool-labels';
  import {
    getAgentToolInput,
    getAgentToolName,
    getAgentToolResult,
    getAgentToolStatus,
    isAgentToolPart,
    type AgentToolPart
  } from '$features/ai-assistant/utils/tool-parts';
  import {
    chatDraft,
    clearChatDraft,
    initialChatModel,
    initialChatPrompt,
    initialChatTemplateId,
    clearInitialChatModel,
    clearInitialChatPrompt,
    clearInitialChatTemplateId
  } from '$features/ai-assistant/utils/store';
  import { get } from 'svelte/store';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { courseApi, lessonApi } from '$features/course/api';
  import { getMentionableContent } from '$features/course/utils/content';
  import { refreshExercisePageData } from '$features/course/utils/exercise-page-utils';
  import { getRequestBaseUrl, apiClient } from '$lib/utils/services/api';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { aiAssistantApi } from '$features/ai-assistant/api/ai-assistant.svelte';
  import { profile } from '$lib/utils/store/user';
  import type {
    AiAssistantMessage,
    AiAssistantMessageMetadata,
    AiAssistantTemplateMetadata,
    AgentRunStep,
    UploadedDocument
  } from '$features/ai-assistant/utils/types';
  import { getCourseTemplate, type CourseTemplateId, type TemplateFormField } from '@cio/ai-assistant';
  import {
    AI_CHAT_MODEL_STORAGE_KEY,
    AI_ASSISTANT_QUICK_ACTION_ENTRIES,
    STUDENT_QUICK_ACTION_ENTRIES
  } from '$features/ai-assistant/utils/constants';
  import {
    AGENT_MODELS,
    AGENT_MODEL_IDS,
    DEFAULT_PICKER_MODEL_ID,
    UI_PICKER_MODEL_IDS,
    type AgentModelId
  } from '@cio/utils/agent-models';

  /** Every ~30% / 60% / 90% of tool steps completed, refetch course so UI reflects partial mutations */
  const AGENT_STEP_PROGRESS_REFRESH_RATIOS = [0.3, 0.6, 0.9] as const;

  /** Completed-step thresholds already refreshed for this streaming session */
  let agentMutationProgressThresholdsTriggered = new SvelteSet<number>();
  let lastSeenStreamingFlag = false;

  /** Tracks the active durable run so we reset thresholds when a new run starts. */
  let lastSeenDurableRunId = '';
  /** Last step count seen for the active durable run; lets us skip recompute on no-op polls. */
  let lastSeenDurableStepCount = 0;
  /** Run ids we've already injected a synthetic summary message for in this session. */
  let lastInjectedRunSummaryId = '';
  /**
   * Statuses that warrant injecting a synthetic summary message into the
   * conversation. Only `completed` is auto-injected — canceled runs are
   * resumable, so the summary is deferred until the user explicitly
   * dismisses the canceled run.
   */
  const INJECTABLE_RUN_STATUSES = new Set(['completed']);
  /**
   * Statuses that keep the panel in run-mode (composer hidden). `canceled`
   * stays here so the user can either Resume or Dismiss — only `completed`
   * unconditionally flips back to planning.
   */
  const RUN_MODE_STATUSES = new Set(['queued', 'running', 'waiting_for_input', 'paused', 'failed', 'canceled']);

  const RUN_POLL_INTERVAL_MS = 3_000;
  const RUN_POLL_STATUSES = new Set(['queued', 'running', 'waiting_for_input']);
  const RUN_RESUMABLE_STATUSES = new Set(['paused', 'waiting_for_input', 'canceled']);
  const RUN_TERMINAL_STATUSES = new Set(['completed', 'failed', 'canceled', 'paused']);

  // Read course id from the route. The chat panel is only mounted inside the
  // course content layout, so `page.params.id` is always the active course.
  const courseId = $derived(page.params?.id as string);

  // Extract current lessonId/exerciseId from route params
  const currentLessonId = $derived(page.params?.lessonId as string | undefined);
  const currentExerciseId = $derived(page.params?.exerciseId as string | undefined);

  let inputValue = $state('');
  let uploadedDocument: UploadedDocument | null = $state(null);
  let isUploading = $state(false);

  let pendingInitialTemplateId: CourseTemplateId | null = $state(null);

  let statusFetchedForCourseId: string | null = $state(null);
  let conversationsLoadedForCourseId: string | null = $state(null);
  let runsLoadedForCourseId: string | null = $state(null);
  let lastRunStatusSig = $state('');
  let activeConversationId: string | null = $state(null);
  let isLoadingHistory = $state(false);
  let selectedModel: AgentModelId = $state(DEFAULT_PICKER_MODEL_ID);
  const paidModelIds = UI_PICKER_MODEL_IDS.filter((id) => !AGENT_MODELS[id].isFree);

  function isAgentModelId(value: unknown): value is AgentModelId {
    return typeof value === 'string' && (AGENT_MODEL_IDS as readonly string[]).includes(value);
  }

  function handleSelectModel(id: AgentModelId) {
    if ($isFreePlan && paidModelIds.includes(id)) {
      openUpgradeModal();
      return;
    }

    selectedModel = id;

    try {
      localStorage.setItem(AI_CHAT_MODEL_STORAGE_KEY, id);
    } catch {
      // localStorage unavailable
    }
  }

  function handleLockedModelSelect() {
    openUpgradeModal();
  }

  const tokenUsage = $derived(aiAssistantApi.status?.usage ?? null);

  $effect(() => {
    if (!$isFreePlan || !paidModelIds.includes(selectedModel)) {
      return;
    }

    selectedModel = DEFAULT_PICKER_MODEL_ID;

    try {
      localStorage.setItem(AI_CHAT_MODEL_STORAGE_KEY, DEFAULT_PICKER_MODEL_ID);
    } catch {
      // localStorage unavailable
    }
  });

  function getStorageKey(courseId: string) {
    return `ai-chat-active-${courseId}`;
  }

  function getActiveConversationId(courseId: string): string | null {
    try {
      return localStorage.getItem(getStorageKey(courseId));
    } catch {
      return null;
    }
  }

  function setActiveConversationId(courseId: string, conversationId: string | null) {
    activeConversationId = conversationId;

    try {
      if (conversationId) {
        localStorage.setItem(getStorageKey(courseId), conversationId);
      } else {
        localStorage.removeItem(getStorageKey(courseId));
      }
    } catch {
      // localStorage unavailable
    }
  }

  let pendingLoadId: string | null = null;

  async function loadConversation(conversationId: string) {
    if (!courseId) return;

    pendingLoadId = conversationId;
    await aiAssistantApi.loadConversation(conversationId);

    // Another switch was requested while this one was in flight — drop this result.
    if (pendingLoadId !== conversationId) {
      return;
    }

    const conversation = aiAssistantApi.currentConversation;

    if (!conversation) {
      return;
    }

    if (chat.status === 'streaming' || chat.status === 'submitted') {
      return;
    }

    const loadedMessages = (conversation.messages ?? []) as AiAssistantMessage[];

    // Only overwrite in-memory messages if the loaded conversation actually has saved
    // messages. An empty result means the conversation was just created and the first
    // message hasn't been persisted yet — overwriting would wipe the optimistic message
    // that chat.sendMessage already placed in the UI.
    if (loadedMessages.length > 0) {
      chat.messages = loadedMessages;
    }

    setActiveConversationId(courseId, conversationId);
  }

  async function startNewChat() {
    if (!courseId) return;

    const created = await aiAssistantApi.createConversation(courseId);

    if (created) {
      chat.messages = [];
      setActiveConversationId(courseId, created.id);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    if (!courseId) return;

    await aiAssistantApi.deleteConversation(conversationId);

    if (activeConversationId === conversationId) {
      chat.messages = [];
      setActiveConversationId(courseId, null);
    }
  }

  async function handleRenameConversation(conversationId: string, title: string) {
    const updatedTitle = await aiAssistantApi.renameConversation(conversationId, title);

    if (!updatedTitle) {
      const rawError = aiAssistantApi.error;
      let message = t.get('ai_assistant.rename_chat_failed');

      if (rawError && !rawError.startsWith('{')) {
        message = rawError;
      }

      throw new Error(message);
    }
  }

  // Fetch status and load conversations when the chat panel mounts (the
  // SidePanelRail only mounts this component while the panel is active) or
  // when the route's courseId changes.
  $effect(() => {
    if (!courseId) return;

    if (statusFetchedForCourseId !== courseId) {
      statusFetchedForCourseId = courseId;
      aiAssistantApi.fetchStatus(courseId);
    }

    if (conversationsLoadedForCourseId !== courseId) {
      conversationsLoadedForCourseId = courseId;

      // If the panel was just opened to start a fresh chat (e.g. via quoteInChat),
      // skip the auto-load so the draft effect can call startNewChat itself.
      const pendingDraft = get(chatDraft);

      if (pendingDraft?.mode === 'new') {
        return;
      }

      // Content Ask AI bar (and org home) set this before opening the panel; loading a
      // saved conversation would race handleSend and wipe the optimistic user message.
      const pendingPrompt = get(initialChatPrompt);

      if (pendingPrompt?.trim()) {
        return;
      }

      const listForCourseId = courseId;
      const savedId = getActiveConversationId(listForCourseId);

      isLoadingHistory = true;
      aiAssistantApi
        .listConversations(listForCourseId)
        .then(async () => {
          if (courseId !== listForCourseId) return;
          if (activeConversationId) return;
          if (chat.status === 'streaming' || chat.status === 'submitted') return;

          if (savedId) {
            await loadConversation(savedId);
          } else if (aiAssistantApi.conversations.length > 0) {
            await loadConversation(aiAssistantApi.conversations[0].id);
          }
        })
        .finally(() => {
          if (courseId === listForCourseId) {
            isLoadingHistory = false;
          }
        });
    }

    if (runsLoadedForCourseId !== courseId) {
      runsLoadedForCourseId = courseId;
      void aiAssistantApi.loadActiveRun(courseId);
    }
  });

  function refreshCourseStateAfterChat() {
    const profileId = $profile.id;

    // Force refetch course data so new sections/lessons/exercises show in the UI
    if (courseId && profileId) {
      void courseApi.refreshCourse(courseId, profileId);
    }

    // Refresh current lesson content if viewing a lesson
    if (courseId && currentLessonId) {
      void lessonApi.get(courseId, currentLessonId);
    }

    // Refresh current exercise if viewing an exercise
    if (courseId && currentExerciseId) {
      void refreshExercisePageData(courseId, currentExerciseId);
    }

    // Refresh usage meter
    if (courseId) {
      void aiAssistantApi.fetchStatus(courseId);
    }
  }

  async function persistFinishedChat(messages: AiAssistantMessage[], conversationId: string | null) {
    if (conversationId) {
      await aiAssistantApi.saveMessages(conversationId, messages);

      // Generate a smart title after the first exchange (when title is still default)
      const activeConv = aiAssistantApi.conversations.find((c) => c.id === conversationId);
      const isDefaultTitle = !activeConv?.title || activeConv.title === 'New conversation';
      const firstUserMsg = messages.find((message) => message.role === 'user');
      const textPart = firstUserMsg?.parts?.find(
        (part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text'
      );

      if (isDefaultTitle && textPart?.text) {
        await aiAssistantApi.generateTitle(conversationId, textPart.text.slice(0, 500));
      }

      return;
    }

    if (!courseId) return;

    // No active conversation yet — create one and save
    const created = await aiAssistantApi.createConversation(courseId);

    if (!created) return;

    setActiveConversationId(courseId, created.id);
    await aiAssistantApi.saveMessages(created.id, messages);

    const firstUserMsg = messages.find((message) => message.role === 'user');
    const textPart = firstUserMsg?.parts?.find(
      (part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text'
    );

    if (textPart?.text) {
      await aiAssistantApi.generateTitle(created.id, textPart.text.slice(0, 500));
    }
  }

  const chat = new Chat({
    id: 'ai-assistant',
    transport: new DefaultChatTransport({
      api: `${getRequestBaseUrl()}/agent/chat`,
      credentials: 'include',
      body: () => ({
        courseId,
        conversationId: activeConversationId ?? undefined,
        model: selectedModel,
        context: {
          lessonId: page.params?.lessonId,
          exerciseId: page.params?.exerciseId,
          documentId: uploadedDocument?.id
        }
      }),
      fetch: (input, init) => apiClient.request(input, init)
    }),
    onFinish: () => {
      // Clear document attachment after message is processed
      uploadedDocument = null;

      refreshCourseStateAfterChat();
      void persistFinishedChat(chat.messages as AiAssistantMessage[], activeConversationId);
    }
  });

  function buildTemplateAnswersSummary(
    templateId: CourseTemplateId,
    answers: Record<string, string>,
    fields: TemplateFormField[]
  ): string {
    const template = getCourseTemplate(templateId);
    const registryById = new Map((template?.fields ?? []).map((field) => [field.id, field]));
    const lines: string[] = ['Here are my answers for the course template:'];
    const seen = new Set<string>();

    for (const field of fields) {
      if (!field?.id || seen.has(field.id)) {
        continue;
      }

      seen.add(field.id);
      const trimmed = answers[field.id]?.trim() ?? '';

      if (!trimmed) {
        continue;
      }

      const label = registryById.get(field.id)?.label ?? field.label ?? field.id;
      lines.push(`- ${label}: ${trimmed}`);
    }

    // Capture any answers whose field isn't in the rendered list (defensive — shouldn't happen)
    for (const [fieldId, value] of Object.entries(answers)) {
      if (seen.has(fieldId)) continue;

      const trimmed = value.trim();
      if (!trimmed) continue;

      const label = registryById.get(fieldId)?.label ?? fieldId;
      lines.push(`- ${label}: ${trimmed}`);
    }

    return lines.join('\n');
  }

  async function handleSend() {
    if (!inputValue.trim() || chat.status === 'streaming') return;
    if (!courseId) return;

    const text = inputValue;
    const userMessageCount = chat.messages.filter((message) => message.role === 'user').length;
    const templateForFirstMessage = userMessageCount === 0 ? pendingInitialTemplateId : null;

    const messageAttachment = uploadedDocument
      ? {
          documentId: uploadedDocument.id,
          name: uploadedDocument.name
        }
      : undefined;

    const metadata: AiAssistantMessageMetadata = {};

    if (messageAttachment) {
      metadata.attachment = messageAttachment;
    }

    if (templateForFirstMessage) {
      const templateMeta: AiAssistantTemplateMetadata = { id: templateForFirstMessage };
      metadata.template = templateMeta;
    }

    const conversationId = await ensureActiveConversation(courseId);
    if (!conversationId) return;

    if (templateForFirstMessage) {
      pendingInitialTemplateId = null;
    }

    inputValue = '';

    chat.sendMessage({
      text,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {})
    });
  }

  async function handleSubmitTemplateAnswers(payload: {
    templateId: CourseTemplateId;
    answers: Record<string, string>;
    fields: TemplateFormField[];
  }) {
    if (!courseId || chat.status === 'streaming') {
      return;
    }

    const conversationId = await ensureActiveConversation(courseId);
    if (!conversationId) return;

    chat.sendMessage({
      text: buildTemplateAnswersSummary(payload.templateId, payload.answers, payload.fields),
      metadata: {
        template: {
          action: 'submit_template_answers',
          templateId: payload.templateId,
          answers: payload.answers
        }
      }
    });
  }

  async function handleSkipTemplateForm(payload: { templateId: CourseTemplateId }) {
    if (!courseId || chat.status === 'streaming') {
      return;
    }

    const conversationId = await ensureActiveConversation(courseId);
    if (!conversationId) return;

    chat.sendMessage({
      text: "I'll answer your questions in chat instead of the form.",
      metadata: {
        template: {
          action: 'skip_template_form',
          templateId: payload.templateId
        }
      }
    });
  }

  async function ensureActiveConversation(courseId: string): Promise<string | null> {
    if (activeConversationId) return activeConversationId;

    const created = await aiAssistantApi.createConversation(courseId);

    if (!created) return null;

    setActiveConversationId(courseId, created.id);

    return created.id;
  }

  async function handleFileSelect(file: File) {
    if (!courseId) return;

    const conversationId = await ensureActiveConversation(courseId);

    if (!conversationId) return;

    isUploading = true;
    const result = await aiAssistantApi.uploadDocument(file, courseId, conversationId);
    isUploading = false;

    if (result) {
      uploadedDocument = { id: result.documentId, name: result.fileName };
    }
  }

  function handleRemoveDocument() {
    uploadedDocument = null;
  }

  function handleQuickAction(action: string) {
    inputValue = action;
    void handleSend();
  }

  function handleStop() {
    chat.stop();
  }

  function isRunActive(status: string | undefined): boolean {
    return status === 'queued' || status === 'running' || status === 'waiting_for_input';
  }

  function getRunToolName(step: AgentRunStep): string | null {
    if (step.stepType.startsWith('tool:')) {
      return step.stepType.slice('tool:'.length);
    }

    const toolName = step.input?.toolName;

    return typeof toolName === 'string' && toolName.length > 0 ? toolName : null;
  }

  function getRunStepInput(step: AgentRunStep): unknown {
    const args = step.input?.args;

    return args ?? step.input ?? undefined;
  }

  function getRunStepResult(step: AgentRunStep): unknown {
    const output = step.output;

    if (!output || typeof output !== 'object') {
      return output ?? undefined;
    }

    if (Object.prototype.hasOwnProperty.call(output, 'result')) {
      return (output as Record<string, unknown>).result;
    }

    return output;
  }

  function getRunProgressStatus(status: string): ProgressStep['status'] {
    if (status === 'completed') return 'completed';
    if (status === 'running') return 'in_progress';
    if (status === 'failed' || status === 'canceled') return 'failed';

    return 'pending';
  }

  function toRunProgressStep(step: AgentRunStep): ProgressStep {
    const toolName = getRunToolName(step);
    const status = getRunProgressStatus(step.status);

    if (!toolName) {
      return {
        status,
        line: { shape: 'i18n', key: 'ai_assistant.run_checkpoint' }
      };
    }

    return {
      status,
      line:
        status === 'completed'
          ? getCompletedToolLine(toolName, getRunStepResult(step))
          : getPendingToolLine(toolName, getRunStepInput(step))
    };
  }

  async function handleImplementPlan(editedPlan: unknown) {
    if (chat.status === 'streaming') return;
    if (!courseId) return;

    const existingRunStatus = aiAssistantApi.currentRun?.run.status;
    if (isRunActive(existingRunStatus)) return;

    const conversationId = await ensureActiveConversation(courseId);
    if (!conversationId) return;
    if (!editedPlan || typeof editedPlan !== 'object') return;

    inputValue = '';
    await persistFinishedChat(chat.messages as AiAssistantMessage[], conversationId);

    await aiAssistantApi.createRun({
      courseId,
      conversationId,
      approvedPlan: editedPlan as Record<string, unknown>,
      model: selectedModel
    });
  }

  async function handleCancelRun() {
    const runId = aiAssistantApi.currentRun?.run.id;
    if (!runId) return;

    await aiAssistantApi.cancelRun(runId);
    refreshCourseStateAfterChat();
  }

  async function handleRetryRun() {
    const runId = aiAssistantApi.currentRun?.run.id;
    if (!runId) return;

    await aiAssistantApi.retryRun(runId);
  }

  async function handleResumeRun() {
    const runId = aiAssistantApi.currentRun?.run.id;
    if (!runId) return;

    await aiAssistantApi.resumeRun(runId);
  }

  /**
   * Walk away from a canceled run: inject the run-summary message into the
   * conversation (the same one we used to auto-write on cancel) and clear
   * the local currentRun so the panel flips back to planning. The run row
   * itself stays in the DB — user could still find it in run history.
   */
  async function handleDismissRun() {
    const runDetail = aiAssistantApi.currentRun;
    if (!runDetail || !activeConversationId) return;
    if (runDetail.run.conversationId !== activeConversationId) return;

    const summaryMeta = buildRunSummaryMetadata({ runDetail, resolveExerciseTitle });
    if (summaryMeta) {
      const alreadyInConversation = (chat.messages as AiAssistantMessage[]).some(
        (msg) => (msg.metadata as AiAssistantMessageMetadata | undefined)?.runSummary?.runId === summaryMeta.runId
      );

      if (!alreadyInConversation) {
        const summaryMessage: AiAssistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          parts: [{ type: 'text', text: buildRunSummaryText(summaryMeta) }],
          metadata: { runSummary: summaryMeta } satisfies AiAssistantMessageMetadata
        };

        chat.messages = [...(chat.messages as AiAssistantMessage[]), summaryMessage];
        lastInjectedRunSummaryId = summaryMeta.runId;
        void aiAssistantApi.saveMessages(activeConversationId, chat.messages as AiAssistantMessage[]);
      }
    }

    aiAssistantApi.currentRun = null;
  }

  async function handleAskPlanChanges(message: string) {
    const trimmed = message.trim();

    if (!trimmed || chat.status === 'streaming') return;
    if (!courseId) return;

    const conversationId = await ensureActiveConversation(courseId);
    if (!conversationId) return;

    chat.sendMessage({ text: trimmed });
  }

  function handleMentionClick(route: string) {
    goto(resolve(route, {}));
  }

  const isStreaming = $derived(chat.status === 'streaming' || chat.status === 'submitted');
  const isExhausted = $derived(tokenUsage !== null && tokenUsage.remaining <= 0);

  const status = $derived(aiAssistantApi.status);
  const isStudent = $derived(status?.role === 'student');
  const tutorStatus = $derived(status?.tutor);

  const tutorErrorCode = $derived.by(() => {
    if (!chat.error) return null;
    const message = chat.error.message ?? '';
    if (message.includes('AI_TUTOR_DISABLED')) return 'AI_TUTOR_DISABLED' as const;
    if (message.includes('LEARNER_CAP_REACHED')) return 'LEARNER_CAP_REACHED' as const;
    if (message.includes('POOL_EXHAUSTED')) return 'POOL_EXHAUSTED' as const;
    return null;
  });

  const tutorBlocked = $derived.by(() => {
    if (!isStudent) return null;
    if (tutorErrorCode) return tutorErrorCode;
    if (tutorStatus && tutorStatus.enabled === false) return 'AI_TUTOR_DISABLED' as const;
    if (tutorStatus && tutorStatus.enforced && tutorStatus.capRemaining !== null && tutorStatus.capRemaining <= 0) {
      return 'LEARNER_CAP_REACHED' as const;
    }
    return null;
  });

  const quickActions = $derived(isStudent ? [...STUDENT_QUICK_ACTION_ENTRIES] : [...AI_ASSISTANT_QUICK_ACTION_ENTRIES]);

  // Student-facing per-learner monthly cap (100 messages). Hidden when the agent reports
  // no tutor data (e.g. provider unconfigured) so we don't render a 0/0 bar.
  const studentMessageUsage = $derived.by(() => {
    if (!isStudent || !tutorStatus || tutorStatus.cap == null || tutorStatus.capRemaining == null) {
      return null;
    }

    return {
      used: Math.max(0, tutorStatus.cap - tutorStatus.capRemaining),
      cap: tutorStatus.cap
    };
  });

  const mentionItems = $derived(
    getMentionableContent(courseApi.course).map((item) => ({
      id: item.id,
      label: item.title,
      type: item.type
    }))
  );

  // Show an activity card whenever the agent calls any tool.
  // Hides automatically once the agent finishes cleanly; stays visible if stopped mid-way.
  const planExecutionState = $derived.by(() => {
    const lastMsg = chat.messages[chat.messages.length - 1];

    if (!lastMsg) return null;

    // If the most recent message is from the user, the agent has not produced a
    // reply yet — don't show the previous assistant's tool card. While streaming
    // is starting up, fall through to the thinking placeholder below.
    if (lastMsg.role !== 'assistant') {
      if (!isStreaming) return null;

      return {
        steps: [
          {
            status: 'in_progress' as const,
            line: { shape: 'i18n' as const, key: 'ai_assistant.plan_thinking' }
          }
        ],
        currentActionLine: undefined,
        isStopped: false,
        titleKey: 'ai_assistant.plan_working',
        hasMutations: false
      };
    }

    const lastAssistantMsg = lastMsg;

    const continuation = (lastAssistantMsg.metadata as AiAssistantMessageMetadata | undefined)?.continuation;
    const reachedStepLimit = continuation?.reason === 'step_limit';
    const allToolParts = lastAssistantMsg.parts.filter((part: Record<string, unknown>) =>
      isAgentToolPart(part)
    ) as AgentToolPart[];

    // generate_course_plan renders its own PlanView — exclude it from the card
    const toolParts = allToolParts.filter((part) => {
      const toolName = getAgentToolName(part);
      return toolName !== 'generate_course_plan' && toolName !== 'ask_template_questions';
    });

    if (toolParts.length === 0) {
      if (!isStreaming) return null;

      // The agent is mid-turn (reasoning / preparing a tool call) but hasn't emitted
      // a real tool part yet. Show a placeholder step so the user always sees activity.
      return {
        steps: [
          {
            status: 'in_progress' as const,
            line: { shape: 'i18n' as const, key: 'ai_assistant.plan_thinking' }
          }
        ],
        currentActionLine: undefined,
        isStopped: false,
        titleKey: 'ai_assistant.plan_working',
        hasMutations: false
      };
    }

    const steps: ProgressStep[] = toolParts.flatMap((part) => {
      const toolName = getAgentToolName(part);

      if (!toolName) {
        return [];
      }

      const result = getAgentToolResult(part) as Record<string, unknown> | undefined;
      const status = getAgentToolStatus(part);
      const line =
        status === 'completed'
          ? getCompletedToolLine(toolName, result)
          : getPendingToolLine(toolName, getAgentToolInput(part));

      return [{ line, status }];
    });

    const allDone = steps.every((s) => s.status === 'completed');
    const isStopped = !isStreaming && (!allDone || reachedStepLimit);

    // Hide the card once the agent finishes cleanly — the text response takes over
    if (allDone && !isStreaming && !reachedStepLimit) return null;

    const hasMutations = toolParts.some((part) => {
      const toolName = getAgentToolName(part);
      return toolName ? MUTATION_TOOLS.includes(toolName) : false;
    });
    const titleKey = hasMutations ? 'ai_assistant.plan_applying_changes' : 'ai_assistant.plan_working';
    const currentActionLine = steps.find((s) => s.status === 'in_progress')?.line;

    return { steps, currentActionLine, isStopped, titleKey, hasMutations };
  });

  const durableRunState = $derived.by(() => {
    const runDetail = aiAssistantApi.currentRun;

    if (!runDetail || runDetail.run.courseId !== courseId) {
      return null;
    }

    const run = runDetail.run;
    const steps = runDetail.steps.map(toRunProgressStep);

    const titleKey =
      run.status === 'completed'
        ? 'ai_assistant.run_completed'
        : run.status === 'failed'
          ? 'ai_assistant.run_failed'
          : run.status === 'canceled'
            ? 'ai_assistant.run_canceled'
            : 'ai_assistant.run_running';

    const waitingLine: ToolLineUi | undefined =
      steps.length === 0 && run.status !== 'failed' && run.status !== 'canceled'
        ? { shape: 'i18n' as const, key: 'ai_assistant.run_waiting_for_worker' }
        : undefined;
    const currentActionLine = steps.find((step) => step.status === 'in_progress')?.line ?? waitingLine;

    return {
      titleKey,
      steps,
      currentActionLine,
      isStopped: run.status === 'failed' || run.status === 'canceled' || run.status === 'paused',
      error: run.lastError?.message,
      canCancel: run.status === 'queued' || run.status === 'running' || run.status === 'waiting_for_input',
      canRetry: run.status === 'failed',
      canResume: RUN_RESUMABLE_STATUSES.has(run.status)
    };
  });

  /**
   * Decides what the bottom of the chat panel is showing: the composer
   * (`planning`) or the durable run monitor (`running`). The run must belong
   * to the active conversation — a paused run on a different conversation
   * should not hijack this one. Completed/canceled runs flip back to
   * planning even if `currentRun` is still in memory.
   */
  const panelMode = $derived.by<'planning' | 'running'>(() => {
    const runDetail = aiAssistantApi.currentRun;
    if (!runDetail) return 'planning';
    if (runDetail.run.courseId !== courseId) return 'planning';
    if (activeConversationId && runDetail.run.conversationId !== activeConversationId) return 'planning';
    return RUN_MODE_STATUSES.has(runDetail.run.status) ? 'running' : 'planning';
  });

  /**
   * True when any historical `PlanView` card in this conversation should default
   * to its collapsed form. We minimize either when the plan card has been
   * pushed back by newer assistant content (no longer the latest message) or
   * the moment implementation kicks off — both signal the user's attention is
   * elsewhere. `PlanView` itself preserves manual expand/collapse overrides.
   */
  const planShouldCollapse = $derived(panelMode === 'running');

  /** Statuses where the worker is still actively executing — hide the changes card. */
  const ACTIVELY_EXECUTING = new Set(['queued', 'running', 'waiting_for_input']);

  /**
   * Build a map of every exercise id → title from the loaded course outline so
   * the changes extractor can resolve titles for exercise-section actions
   * (which only expose the parent exercise id, not its title).
   */
  const resolveExerciseTitle = $derived.by<ExerciseTitleLookup>(() => {
    const course = courseApi.course;
    if (!course?.content) return () => undefined;

    const titles = new Map<string, string>();

    const visitItems = (items: { id: string; title?: string; type?: unknown }[] | undefined) => {
      if (!items) return;
      for (const item of items) {
        // Heuristic: only the exercise content type has a route-relevant id we care about.
        // We index everything that has a title — the lookup is exercise-scoped at call time.
        if (item.id && typeof item.title === 'string') {
          titles.set(item.id, item.title);
        }
      }
    };

    visitItems(course.content.items as unknown as { id: string; title?: string; type?: unknown }[] | undefined);
    for (const section of course.content.sections ?? []) {
      visitItems((section as unknown as { items?: { id: string; title?: string; type?: unknown }[] }).items);
    }

    return (exerciseId: string) => titles.get(exerciseId);
  });

  /**
   * Per-item changes the agent just made to this conversation's content.
   * Three sources, in priority order:
   *   1. The active background run, once it has stopped executing — covers
   *      Agent-mode work (BullMQ runner) with a Completed/Canceled/Paused status.
   *   2. The latest persisted `runSummary.changes` on a message — survives
   *      refresh for runs that have already injected their summary message.
   *   3. Inline chat-mode tool calls aggregated from `chat.messages` — covers
   *      conversations where the agent updated content via tool calls embedded
   *      directly in assistant messages (no background run involved). Carries
   *      no status label.
   */
  const changedItems = $derived.by<RunChangedItem[]>(() => {
    const runDetail = aiAssistantApi.currentRun;
    if (runDetail && runDetail.run.conversationId === activeConversationId) {
      if (!ACTIVELY_EXECUTING.has(runDetail.run.status)) {
        return extractChangedItems(runDetail, resolveExerciseTitle);
      }
    }

    const messages = chat.messages as AiAssistantMessage[];
    for (let i = messages.length - 1; i >= 0; i--) {
      const summary = (messages[i].metadata as AiAssistantMessageMetadata | undefined)?.runSummary;
      if (summary?.changes && summary.changes.length > 0) {
        return summary.changes;
      }
    }

    return extractChangedItemsFromMessages(messages, resolveExerciseTitle);
  });

  function runStatusLabel(status: string): string {
    if (status === 'completed') return t.get('ai_assistant.changes_card.status.completed');
    if (status === 'failed') return t.get('ai_assistant.changes_card.status.failed');
    if (status === 'canceled') return t.get('ai_assistant.changes_card.status.canceled');
    if (status === 'paused') return t.get('ai_assistant.changes_card.status.paused');
    return '';
  }

  /** Status label shown next to the count in the changes card header ("Completed", …). */
  const changedItemsStatusLabel = $derived.by<string | null>(() => {
    const runDetail = aiAssistantApi.currentRun;
    if (runDetail && runDetail.run.conversationId === activeConversationId) {
      if (!ACTIVELY_EXECUTING.has(runDetail.run.status)) {
        return runStatusLabel(runDetail.run.status) || null;
      }
    }

    const messages = chat.messages as AiAssistantMessage[];
    for (let i = messages.length - 1; i >= 0; i--) {
      const summary = (messages[i].metadata as AiAssistantMessageMetadata | undefined)?.runSummary;
      if (summary?.changes && summary.changes.length > 0) {
        return runStatusLabel(summary.status) || null;
      }
    }

    return null;
  });

  function buildRunSummaryText(metadata: AiAssistantRunSummaryMetadata): string {
    const countsText = formatRunSummaryCounts(metadata.counts);

    if (metadata.status === 'completed') {
      return countsText
        ? t.get('ai_assistant.run_summary.completed_with_counts', { counts: countsText })
        : t.get('ai_assistant.run_summary.completed');
    }

    if (metadata.status === 'canceled') {
      return countsText
        ? t.get('ai_assistant.run_summary.canceled_with_counts', { counts: countsText })
        : t.get('ai_assistant.run_summary.canceled');
    }

    if (metadata.status === 'failed') {
      return metadata.error
        ? t.get('ai_assistant.run_summary.failed_with_reason', { reason: metadata.error })
        : t.get('ai_assistant.run_summary.failed');
    }

    return countsText
      ? t.get('ai_assistant.run_summary.paused_with_counts', { counts: countsText })
      : t.get('ai_assistant.run_summary.paused');
  }

  /**
   * Inject a synthetic assistant message summarising the run the first time
   * we observe it reach a settled terminal status. Persists so a refresh
   * still surfaces the summary — and dedupes via metadata.runSummary.runId
   * so we don't double-write across refreshes.
   */
  $effect(() => {
    const runDetail = aiAssistantApi.currentRun;
    if (!runDetail) return;
    if (runDetail.run.courseId !== courseId) return;
    if (!activeConversationId) return;
    if (runDetail.run.conversationId !== activeConversationId) return;
    if (!INJECTABLE_RUN_STATUSES.has(runDetail.run.status)) return;

    const runId = runDetail.run.id;
    if (runId === lastInjectedRunSummaryId) return;

    const alreadyInConversation = (chat.messages as AiAssistantMessage[]).some(
      (msg) => (msg.metadata as AiAssistantMessageMetadata | undefined)?.runSummary?.runId === runId
    );

    if (alreadyInConversation) {
      lastInjectedRunSummaryId = runId;
      return;
    }

    const summaryMeta = buildRunSummaryMetadata({ runDetail, resolveExerciseTitle });
    if (!summaryMeta) return;

    const summaryMessage: AiAssistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      parts: [{ type: 'text', text: buildRunSummaryText(summaryMeta) }],
      metadata: { runSummary: summaryMeta } satisfies AiAssistantMessageMetadata
    };

    chat.messages = [...(chat.messages as AiAssistantMessage[]), summaryMessage];
    lastInjectedRunSummaryId = runId;

    void aiAssistantApi.saveMessages(activeConversationId, chat.messages as AiAssistantMessage[]);
  });

  $effect(() => {
    const run = aiAssistantApi.currentRun?.run;

    if (!run) {
      lastRunStatusSig = '';
      return;
    }

    const nextSig = `${run.id}:${run.status}`;

    if (nextSig === lastRunStatusSig) {
      return;
    }

    const previousSig = lastRunStatusSig;
    lastRunStatusSig = nextSig;

    if (previousSig.startsWith(`${run.id}:`) && RUN_TERMINAL_STATUSES.has(run.status)) {
      refreshCourseStateAfterChat();
    }
  });

  $effect(() => {
    const run = aiAssistantApi.currentRun?.run;

    if (!run || !RUN_POLL_STATUSES.has(run.status)) {
      return;
    }

    const pollTimer = window.setInterval(() => {
      void aiAssistantApi.loadRun(run.id);
    }, RUN_POLL_INTERVAL_MS);

    return () => window.clearInterval(pollTimer);
  });

  $effect(() => {
    const streamingNow = isStreaming;

    if (streamingNow && !lastSeenStreamingFlag) {
      agentMutationProgressThresholdsTriggered.clear();
    }

    lastSeenStreamingFlag = streamingNow;
  });

  $effect(() => {
    if (!isStreaming) {
      return;
    }

    const state = planExecutionState;

    if (!state?.hasMutations || state.isStopped) {
      return;
    }

    const total = state.steps.length;

    if (total === 0) {
      return;
    }

    const completedStepCount = state.steps.filter((s) => s.status === 'completed').length;
    const stepThresholds = [
      ...new Set(
        AGENT_STEP_PROGRESS_REFRESH_RATIOS.map((ratio) => Math.min(total, Math.max(1, Math.ceil(total * ratio))))
      )
    ].sort((a, b) => a - b);

    for (const threshold of stepThresholds) {
      if (completedStepCount >= threshold && !agentMutationProgressThresholdsTriggered.has(threshold)) {
        agentMutationProgressThresholdsTriggered.add(threshold);

        refreshCourseStateAfterChat();
      }
    }
  });

  // Mirrors the inline-streaming threshold refresh for durable background runs
  // (the /agent/runs path). Recomputes only when the run's step count actually
  // changes, so 2s polls that bring no new steps don't trigger work.
  $effect(() => {
    const runDetail = aiAssistantApi.currentRun;

    if (!runDetail || runDetail.run.courseId !== courseId || !RUN_POLL_STATUSES.has(runDetail.run.status)) {
      lastSeenDurableRunId = '';
      lastSeenDurableStepCount = 0;
      return;
    }

    const runId = runDetail.run.id;

    if (runId !== lastSeenDurableRunId) {
      agentMutationProgressThresholdsTriggered.clear();
      lastSeenDurableRunId = runId;
      lastSeenDurableStepCount = 0;
    }

    const total = runDetail.steps.length;
    if (total === 0 || total === lastSeenDurableStepCount) {
      return;
    }

    lastSeenDurableStepCount = total;

    const completedStepCount = runDetail.steps.filter((step) => step.status === 'completed').length;
    const stepThresholds = [
      ...new Set(
        AGENT_STEP_PROGRESS_REFRESH_RATIOS.map((ratio) => Math.min(total, Math.max(1, Math.ceil(total * ratio))))
      )
    ].sort((a, b) => a - b);

    for (const threshold of stepThresholds) {
      if (completedStepCount >= threshold && !agentMutationProgressThresholdsTriggered.has(threshold)) {
        agentMutationProgressThresholdsTriggered.add(threshold);

        refreshCourseStateAfterChat();
      }
    }
  });

  const conversationTitle = $derived(
    aiAssistantApi.conversations.find((c) => c.id === activeConversationId)?.title ?? null
  );

  onMount(() => {
    try {
      const storedModel = localStorage.getItem(AI_CHAT_MODEL_STORAGE_KEY);

      if (isAgentModelId(storedModel)) {
        selectedModel = storedModel;
      }
    } catch {
      // localStorage unavailable
    }
  });

  $effect(() => {
    const prompt = $initialChatPrompt;

    if (!prompt || !courseId) return;

    const model = $initialChatModel;
    const templateFromHome = $initialChatTemplateId;
    clearInitialChatPrompt();
    clearInitialChatModel();
    clearInitialChatTemplateId();

    tick().then(() => {
      pendingInitialTemplateId = templateFromHome ?? null;

      if (model && isAgentModelId(model)) {
        if ($isFreePlan && paidModelIds.includes(model)) {
          openUpgradeModal();
          return;
        }

        handleSelectModel(model);
      }

      inputValue = prompt;
      void handleSend();
    });
  });

  $effect(() => {
    const draft = $chatDraft;

    if (!draft || !draft.text) {
      return;
    }

    clearChatDraft();

    if (draft.mode === 'new') {
      void startNewChat().then(() =>
        tick().then(() => {
          inputValue = `${draft.text}\n\n`;
        })
      );

      return;
    }

    void tick().then(() => {
      const existing = inputValue.trimEnd();

      inputValue = existing ? `${draft.text}\n\n${existing}` : `${draft.text}\n\n`;
    });
  });
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <ChatHeader
    {tokenUsage}
    {isStudent}
    {studentMessageUsage}
    {conversationTitle}
    conversations={aiAssistantApi.conversations}
    {activeConversationId}
    isNewChatDisabled={chat.messages.length === 0}
    onNewChat={startNewChat}
    onLoadConversation={loadConversation}
    onDeleteConversation={handleDeleteConversation}
    onRenameConversation={handleRenameConversation}
  />

  <ChatMessageList
    messages={chat.messages}
    {isStreaming}
    {isLoadingHistory}
    {isStudent}
    {courseId}
    {planExecutionState}
    {planShouldCollapse}
    {quickActions}
    onQuickAction={handleQuickAction}
    onImplementPlan={handleImplementPlan}
    onAskPlanChanges={handleAskPlanChanges}
    onSubmitTemplateAnswers={handleSubmitTemplateAnswers}
    onSkipTemplateForm={handleSkipTemplateForm}
    onStop={handleStop}
    onMentionClick={handleMentionClick}
  />

  {#if panelMode === 'running' && durableRunState}
    <RunMonitorPane
      state={durableRunState}
      {courseId}
      onCancel={handleCancelRun}
      onResume={handleResumeRun}
      onRetry={handleRetryRun}
      onDismiss={handleDismissRun}
      runStatus={aiAssistantApi.currentRun?.run.status ?? null}
      queuedSince={aiAssistantApi.currentRun?.run.createdAt ?? null}
      onMentionClick={handleMentionClick}
    />
  {:else}
    {#if changedItems.length > 0}
      <ChatChangesCard
        items={changedItems}
        {courseId}
        onNavigate={handleMentionClick}
        statusLabel={changedItemsStatusLabel}
      />
    {/if}
    <ChatInput
      bind:inputValue
      {isStreaming}
      {isExhausted}
      {isUploading}
      {uploadedDocument}
      {mentionItems}
      {selectedModel}
      {isStudent}
      {tutorBlocked}
      lockedModelIds={$isFreePlan ? paidModelIds : []}
      error={chat.error}
      onSend={handleSend}
      onStop={handleStop}
      onFileSelect={handleFileSelect}
      onRemoveDocument={handleRemoveDocument}
      onSelectModel={handleSelectModel}
      onLockedModelSelect={handleLockedModelSelect}
    />
  {/if}
</div>
