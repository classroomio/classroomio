<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import ChatHeader from '$features/ai-assistant/chat-header.svelte';
  import ChatMessageList from '$features/ai-assistant/chat-message-list.svelte';
  import ChatInput from '$features/ai-assistant/chat-input.svelte';
  import { resolve } from '$app/paths';
  import { getToolLabel, getToolResultLabel, MUTATION_TOOLS } from '$features/ai-assistant/utils/tool-labels';
  import type { ProgressStep } from '$features/ai-assistant/utils/tool-labels';
  import {
    getAgentToolName,
    getAgentToolResult,
    getAgentToolStatus,
    isAgentToolPart,
    type AgentToolPart
  } from '$features/ai-assistant/utils/tool-parts';
  import {
    isAiAssistantOpen,
    initialChatModel,
    initialChatPrompt,
    clearInitialChatModel,
    clearInitialChatPrompt
  } from '$features/ai-assistant/utils/store';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { courseApi, lessonApi } from '$features/course/api';
  import { getMentionableContent } from '$features/course/utils/content';
  import { refreshExercisePageData } from '$features/course/utils/exercise-page-utils';
  import { getRequestBaseUrl, apiClient } from '$lib/utils/services/api';
  import { startResizablePanelDrag } from '$lib/utils/functions/resizable-panel';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { aiAssistantApi } from '$features/ai-assistant/api/ai-assistant.svelte';
  import { profile } from '$lib/utils/store/user';
  import type {
    AiAssistantMessage,
    AiAssistantMessageMetadata,
    UploadedDocument
  } from '$features/ai-assistant/utils/types';
  import {
    AI_CHAT_MODEL_STORAGE_KEY,
    AI_COURSE_CHAT_DEFAULT_WIDTH,
    AI_COURSE_CHAT_MAX_WIDTH,
    AI_COURSE_CHAT_MIN_WIDTH,
    AI_COURSE_CHAT_STORAGE_KEY
  } from '$features/ai-assistant/utils/constants';
  import {
    AGENT_MODELS,
    AGENT_MODEL_IDS,
    DEFAULT_PICKER_MODEL_ID,
    UI_PICKER_MODEL_IDS,
    type AgentModelId
  } from '@cio/utils/agent-models';

  const CONTINUE_IMPLEMENTATION_PROMPT = 'Continue implementing the plan from where you left off.';

  interface Props {
    /** Course id from route / layout `data` (authoritative for this page). */
    courseId: string;
  }

  let { courseId }: Props = $props();

  // Extract current lessonId/exerciseId from route params
  const currentLessonId = $derived(page.params?.lessonId as string | undefined);
  const currentExerciseId = $derived(page.params?.exerciseId as string | undefined);

  let inputValue = $state('');
  let uploadedDocument: UploadedDocument | null = $state(null);
  let isUploading = $state(false);

  let statusFetchedForCourseId: string | null = $state(null);
  let conversationsLoadedForCourseId: string | null = $state(null);
  let activeConversationId: string | null = $state(null);
  let chatWidth = $state(AI_COURSE_CHAT_DEFAULT_WIDTH);
  let hasLoadedChatWidth = $state(false);
  let isChatResizing = $state(false);
  let stopChatResize: (() => void) | null = null;
  let chatShellElement: HTMLDivElement | null = null;
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

  function clampChatWidth(width: number) {
    return Math.min(AI_COURSE_CHAT_MAX_WIDTH, Math.max(AI_COURSE_CHAT_MIN_WIDTH, width));
  }

  function clearChatResizeListeners() {
    stopChatResize?.();
    stopChatResize = null;
  }

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

  // Fetch status and load conversations when the panel opens or route `courseId` changes
  $effect(() => {
    if (!$isAiAssistantOpen) {
      statusFetchedForCourseId = null;
      conversationsLoadedForCourseId = null;

      return;
    }

    if (!courseId) return;

    if (statusFetchedForCourseId !== courseId) {
      statusFetchedForCourseId = courseId;
      aiAssistantApi.fetchStatus(courseId);
    }

    if (conversationsLoadedForCourseId !== courseId) {
      conversationsLoadedForCourseId = courseId;

      const listForCourseId = courseId;
      const savedId = getActiveConversationId(listForCourseId);

      aiAssistantApi.listConversations(listForCourseId).then(() => {
        if (courseId !== listForCourseId) return;

        // If the initial-prompt flow already created and claimed a conversation while
        // listConversations was in-flight, don't clobber it by loading another one.
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

  const quickActions = [
    'Upload a document to create a course',
    'Draft a lesson',
    'Generate questions from this lesson',
    'Summarize this lesson',
    'Help me publish this course'
  ];

  function handleSend() {
    if (!inputValue.trim() || chat.status === 'streaming') return;

    const text = inputValue;
    const messageAttachment = uploadedDocument
      ? {
          documentId: uploadedDocument.id,
          name: uploadedDocument.name
        }
      : undefined;

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
      metadata: messageAttachment ? { attachment: messageAttachment } : undefined
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

  function handleAskPlanChanges() {
    inputValue = '';
  }

  function handleResume() {
    inputValue = CONTINUE_IMPLEMENTATION_PROMPT;
    handleSend();
  }

  function handleMentionClick(route: string) {
    goto(resolve(route, {}));
  }

  const isStreaming = $derived(chat.status === 'streaming' || chat.status === 'submitted');
  const isExhausted = $derived(tokenUsage !== null && tokenUsage.remaining <= 0);

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
    const lastAssistantMsg = [...chat.messages].reverse().find((m) => m.role === 'assistant');

    if (!lastAssistantMsg) return null;

    const continuation = (lastAssistantMsg.metadata as AiAssistantMessageMetadata | undefined)?.continuation;
    const reachedStepLimit = continuation?.reason === 'step_limit';
    const allToolParts = lastAssistantMsg.parts.filter((part: Record<string, unknown>) =>
      isAgentToolPart(part)
    ) as AgentToolPart[];

    // generate_course_plan renders its own PlanView — exclude it from the card
    const toolParts = allToolParts.filter((part) => getAgentToolName(part) !== 'generate_course_plan');

    if (toolParts.length === 0) return null;

    const steps: ProgressStep[] = toolParts.flatMap((part) => {
      const toolName = getAgentToolName(part);

      if (!toolName) {
        return [];
      }

      const result = getAgentToolResult(part) as Record<string, unknown> | undefined;
      const status = getAgentToolStatus(part);
      const label = status === 'completed' ? getToolResultLabel(toolName, result) : getToolLabel(toolName);

      return [{ label, status }];
    });

    const allDone = steps.every((s) => s.status === 'completed');
    const isStopped = !isStreaming && (!allDone || reachedStepLimit);

    // Hide the card once the agent finishes cleanly — the text response takes over
    if (allDone && !isStreaming && !reachedStepLimit) return null;

    const hasMutations = toolParts.some((part) => {
      const toolName = getAgentToolName(part);
      return toolName ? MUTATION_TOOLS.includes(toolName) : false;
    });
    const title = hasMutations ? 'Applying changes' : 'Working';
    const currentAction = steps.find((s) => s.status === 'in_progress')?.label;

    return { steps, currentAction, isStopped, title };
  });

  const conversationTitle = $derived(
    aiAssistantApi.conversations.find((c) => c.id === activeConversationId)?.title ?? null
  );

  function handleChatResizePointerDown(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    clearChatResizeListeners();

    const startWidth = chatWidth;

    stopChatResize = startResizablePanelDrag({
      event,
      startWidth,
      resolveWidth: ({ startWidth, deltaX }) => clampChatWidth(startWidth - deltaX),
      onPreview: (width) => {
        chatShellElement?.style.setProperty('--ai-chat-width', `${width}px`);
      },
      onCommit: ({ width }) => {
        chatWidth = width;
      },
      onDragStart: () => {
        isChatResizing = true;
      },
      onDragEnd: () => {
        isChatResizing = false;
        stopChatResize = null;
      }
    });
  }

  onMount(() => {
    try {
      const storedWidth = Number(localStorage.getItem(AI_COURSE_CHAT_STORAGE_KEY));

      if (Number.isFinite(storedWidth)) {
        chatWidth = clampChatWidth(storedWidth);
      }
    } catch {
      // localStorage unavailable
    }

    try {
      const storedModel = localStorage.getItem(AI_CHAT_MODEL_STORAGE_KEY);

      if (isAgentModelId(storedModel)) {
        selectedModel = storedModel;
      }
    } catch {
      // localStorage unavailable
    }

    hasLoadedChatWidth = true;

    return () => {
      clearChatResizeListeners();
    };
  });

  onDestroy(() => {
    clearChatResizeListeners();
  });

  $effect(() => {
    const prompt = $initialChatPrompt;

    if (!prompt || !$isAiAssistantOpen || !courseId) return;

    const model = $initialChatModel;
    clearInitialChatPrompt();
    clearInitialChatModel();

    tick().then(() => {
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
    if (!hasLoadedChatWidth) {
      return;
    }

    try {
      localStorage.setItem(AI_COURSE_CHAT_STORAGE_KEY, String(Math.round(chatWidth)));
    } catch {
      // localStorage unavailable
    }
  });
</script>

{#snippet chatPanelContent()}
  <ChatHeader
    {tokenUsage}
    {conversationTitle}
    conversations={aiAssistantApi.conversations}
    {activeConversationId}
    isNewChatDisabled={chat.messages.length === 0}
    onNewChat={startNewChat}
    onLoadConversation={loadConversation}
    onDeleteConversation={handleDeleteConversation}
  />

  <ChatMessageList
    messages={chat.messages}
    status={chat.status}
    {isStreaming}
    {courseId}
    {planExecutionState}
    {quickActions}
    onQuickAction={handleQuickAction}
    onImplementPlan={handleImplementPlan}
    onAskPlanChanges={handleAskPlanChanges}
    onStop={handleStop}
    onResume={handleResume}
    onMentionClick={handleMentionClick}
  />

  <ChatInput
    bind:inputValue
    {isStreaming}
    {isExhausted}
    {isUploading}
    {uploadedDocument}
    {mentionItems}
    {selectedModel}
    lockedModelIds={$isFreePlan ? paidModelIds : []}
    error={chat.error}
    onSend={handleSend}
    onStop={handleStop}
    onFileSelect={handleFileSelect}
    onRemoveDocument={handleRemoveDocument}
    onSelectModel={handleSelectModel}
    onLockedModelSelect={handleLockedModelSelect}
  />
{/snippet}

{#if $isAiAssistantOpen}
  <div
    bind:this={chatShellElement}
    data-ai-chat-resizing={isChatResizing}
    class="contents"
    style={`--ai-chat-width: ${chatWidth}px;`}
  >
    <div class="hidden shrink-0 md:block md:w-(--ai-chat-width)"></div>

    <div
      class="ui:bg-background fixed inset-y-0 right-0 z-100 flex h-screen w-full flex-col border-l md:w-(--ai-chat-width)"
    >
      <button
        type="button"
        aria-label="Resize AI assistant panel"
        class="absolute inset-y-0 left-0 hidden w-4 -translate-x-1/2 cursor-col-resize border-0 bg-transparent md:flex"
        onpointerdown={handleChatResizePointerDown}
      >
        <span class="ui:bg-border pointer-events-none h-full w-px"></span>
      </button>

      {@render chatPanelContent()}
    </div>
  </div>
{/if}

<style>
  :global([data-ai-chat-resizing='true'] *) {
    transition-property: none !important;
  }
</style>
