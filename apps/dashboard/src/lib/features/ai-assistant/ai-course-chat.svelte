<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import ChatHeader from '$features/ai-assistant/chat-header.svelte';
  import ChatMessageList from '$features/ai-assistant/chat-message-list.svelte';
  import ChatInput from '$features/ai-assistant/chat-input.svelte';
  import { resolve } from '$app/paths';
  import { getCompletedToolLine, getPendingToolLine, MUTATION_TOOLS } from '$features/ai-assistant/utils/tool-labels';
  import type { ProgressStep } from '$features/ai-assistant/utils/tool-labels';
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
    UploadedDocument
  } from '$features/ai-assistant/utils/types';
  import { getCourseTemplate, type CourseTemplateId, type TemplateFormField } from '@cio/ai-assistant';
  import {
    AI_CHAT_MODEL_STORAGE_KEY,
    AI_ASSISTANT_QUICK_ACTION_ENTRIES,
    STUDENT_QUICK_ACTION_ENTRIES
  } from '$features/ai-assistant/utils/constants';
  import { calculateContextUsage } from '$features/ai-assistant/utils/context-utils';
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

  const CONTINUE_IMPLEMENTATION_PROMPT = 'Continue implementing the plan from where you left off.';

  // Read course id from the route. The chat panel is only mounted inside the
  // course content layout, so `page.params.id` is always the active course.
  const courseId = $derived(page.params?.id as string);

  // Extract current lessonId/exerciseId from route params
  const currentLessonId = $derived(page.params?.lessonId as string | undefined);
  const currentExerciseId = $derived(page.params?.exerciseId as string | undefined);

  let inputValue = $state('');
  let uploadedDocument: UploadedDocument | null = $state(null);
  let isUploading = $state(false);
  let contextFullBusy = $state<null | 'compact' | 'new_chat'>(null);

  let pendingInitialTemplateId: CourseTemplateId | null = $state(null);

  let statusFetchedForCourseId: string | null = $state(null);
  let conversationsLoadedForCourseId: string | null = $state(null);
  let activeConversationId: string | null = $state(null);
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

  async function loadConversation(conversationId: string) {
    if (!courseId) return;

    await aiAssistantApi.loadConversation(conversationId);

    const conversation = aiAssistantApi.currentConversation;

    if (conversation) {
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

      const listForCourseId = courseId;
      const savedId = getActiveConversationId(listForCourseId);

      aiAssistantApi.listConversations(listForCourseId).then(() => {
        if (courseId !== listForCourseId) return;

        if (activeConversationId) return;

        if (savedId) {
          loadConversation(savedId);
        } else if (aiAssistantApi.conversations.length > 0) {
          loadConversation(aiAssistantApi.conversations[0].id);
        }
      });
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

  function handleSend() {
    if (!inputValue.trim() || chat.status === 'streaming') return;

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
      pendingInitialTemplateId = null;
    }

    inputValue = '';

    // Create conversation eagerly before sending the first message
    if (!activeConversationId) {
      if (!courseId) return;

      aiAssistantApi.createConversation(courseId).then((created) => {
        if (created) {
          setActiveConversationId(courseId, created.id);
        }
      });
    }

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

    await ensureActiveConversation(courseId);

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

    await ensureActiveConversation(courseId);

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
    handleSend();
  }

  function handleStop() {
    chat.stop();
  }

  function handleImplementPlan(editedPlan: unknown) {
    if (chat.status === 'streaming') return;

    inputValue = '';

    if (!activeConversationId) {
      if (!courseId) return;

      aiAssistantApi.createConversation(courseId).then((created) => {
        if (created) {
          setActiveConversationId(courseId, created.id);
        }
      });
    }

    chat.sendMessage({
      text: 'Implement this plan.',
      metadata: {
        plan: {
          action: 'implement_course_plan',
          payload: editedPlan
        }
      }
    });
  }

  function handleAskPlanChanges(message: string) {
    const trimmed = message.trim();

    if (!trimmed || chat.status === 'streaming') return;

    if (!activeConversationId && courseId) {
      aiAssistantApi.createConversation(courseId).then((created) => {
        if (created) {
          setActiveConversationId(courseId, created.id);
        }
      });
    }

    chat.sendMessage({ text: trimmed });
  }

  function handleResume() {
    inputValue = CONTINUE_IMPLEMENTATION_PROMPT;
    handleSend();
  }

  function handleMentionClick(route: string) {
    goto(resolve(route, {}));
  }

  async function handleStartNewChatWithSummary() {
    if (!courseId || contextFullBusy) return;

    contextFullBusy = 'new_chat';

    try {
      const summary = await aiAssistantApi.summarizeConversation(chat.messages as AiAssistantMessage[], courseId);

      chat.messages = [];
      setActiveConversationId(courseId, null);

      const created = await aiAssistantApi.createConversation(courseId);

      if (created) {
        setActiveConversationId(courseId, created.id);
      }

      if (summary) {
        inputValue = summary;
        handleSend();
      }
    } finally {
      contextFullBusy = null;
    }
  }

  async function handleCompactConversation() {
    if (!courseId || !activeConversationId || contextFullBusy) return;

    contextFullBusy = 'compact';

    try {
      const compacted = await aiAssistantApi.compactConversation(activeConversationId);

      if (compacted && compacted.length > 0) {
        chat.messages = compacted as AiAssistantMessage[];
        await chat.regenerate();
      }
    } finally {
      contextFullBusy = null;
    }
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

  const contextUsage = $derived(
    calculateContextUsage(chat.messages as AiAssistantMessage[], AGENT_MODELS[selectedModel].contextWindow)
  );

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
      handleSend();
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
    {isStudent}
    {courseId}
    {planExecutionState}
    {quickActions}
    onQuickAction={handleQuickAction}
    onImplementPlan={handleImplementPlan}
    onAskPlanChanges={handleAskPlanChanges}
    onSubmitTemplateAnswers={handleSubmitTemplateAnswers}
    onSkipTemplateForm={handleSkipTemplateForm}
    onStop={handleStop}
    onResume={handleResume}
    onMentionClick={handleMentionClick}
  />

  <ChatInput
    bind:inputValue
    {isStreaming}
    {isExhausted}
    {isUploading}
    {contextFullBusy}
    compactConversationDisabled={!activeConversationId}
    onCompactConversation={handleCompactConversation}
    {uploadedDocument}
    {mentionItems}
    {selectedModel}
    {contextUsage}
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
    onStartNewChatWithSummary={handleStartNewChatWithSummary}
  />
</div>
