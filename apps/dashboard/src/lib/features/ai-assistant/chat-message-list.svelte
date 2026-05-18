<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { Button } from '@cio/ui/base/button';
  import MessageBubble from '$features/ai-assistant/message-bubble.svelte';
  import ProgressCard from '$features/ai-assistant/progress-card.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { ProgressStep, ToolLineUi } from '$features/ai-assistant/utils/tool-labels';
  import type { AiAssistantMessage, AiAssistantMessageMetadata } from '$features/ai-assistant/utils/types';
  import type { CourseTemplateId, TemplateFormField } from '@cio/ai-assistant';

  interface QuickActionOption {
    key: string;
    prompt: string;
  }

  interface PlanExecutionState {
    titleKey: string;
    steps: ProgressStep[];
    currentActionLine?: ToolLineUi;
    isStopped: boolean;
    /** True while the assistant is invoking course-mutation tools (see `MUTATION_TOOLS`). */
    hasMutations?: boolean;
  }

  interface Props {
    messages: AiAssistantMessage[];
    isStreaming: boolean;
    isStudent: boolean;
    courseId: string;
    planExecutionState: PlanExecutionState | null;
    quickActions: QuickActionOption[];
    onQuickAction: (action: string) => void;
    onImplementPlan: (editedPlan: unknown) => void;
    onAskPlanChanges: (message: string) => void;
    onSubmitTemplateAnswers: (payload: {
      templateId: CourseTemplateId;
      answers: Record<string, string>;
      fields: TemplateFormField[];
    }) => void;
    onSkipTemplateForm: (payload: { templateId: CourseTemplateId }) => void;
    onStop: () => void;
    onResume: () => void;
    onMentionClick: (route: string) => void;
  }

  let {
    messages,
    isStreaming,
    isStudent,
    courseId,
    planExecutionState,
    quickActions,
    onQuickAction,
    onImplementPlan,
    onAskPlanChanges,
    onSubmitTemplateAnswers,
    onSkipTemplateForm,
    onStop,
    onResume,
    onMentionClick
  }: Props = $props();

  let messagesContainer: HTMLDivElement | undefined = $state();
  let lastMessageCount = $state(0);
  let lastStepsCount = $state(0);
  let lastCurrentActionSig = $state('');
  let lastStreamingSig = $state(0);

  const isEmpty = $derived(messages.length === 0);

  // Total text length of the most recent assistant message — grows as tokens stream in.
  // Used to keep the view pinned to the latest text while the AI is typing.
  const streamingContentSig = $derived.by(() => {
    if (messages.length === 0) return 0;

    const last = messages[messages.length - 1];

    if (last.role !== 'assistant') return 0;

    let total = 0;

    for (const part of last.parts ?? []) {
      if ((part as { type?: string }).type === 'text') {
        total += ((part as { text?: string }).text ?? '').length;
      }
    }

    return total;
  });

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    requestAnimationFrame(() => {
      messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior });
    });
  }

  $effect(() => {
    if (!messagesContainer || messages.length === 0) return;

    if (messages.length === lastMessageCount) return;

    lastMessageCount = messages.length;
    scrollToBottom();
  });

  $effect(() => {
    if (!messagesContainer) return;

    if (streamingContentSig === lastStreamingSig) return;

    lastStreamingSig = streamingContentSig;
    // Use 'auto' during streaming — smooth scrolls queue up per token and lag behind the cursor.
    scrollToBottom('auto');
  });

  $effect(() => {
    if (!messagesContainer || !planExecutionState) return;

    const stepsCount = planExecutionState.steps.length;
    if (stepsCount !== lastStepsCount) {
      lastStepsCount = stepsCount;
      scrollToBottom();
      return;
    }

    const actionSig = planExecutionState.currentActionLine ? JSON.stringify(planExecutionState.currentActionLine) : '';

    if (actionSig !== lastCurrentActionSig) {
      lastCurrentActionSig = actionSig;
      scrollToBottom();
    }
  });
</script>

<div class="flex-1 overflow-y-auto p-4" bind:this={messagesContainer}>
  {#if isEmpty}
    <!-- Empty state with quick actions -->
    <div class="flex h-full flex-col items-center justify-center gap-4">
      <div class="flex flex-col items-center gap-2 text-center">
        <SparklesIcon size={32} class="ui:text-muted-foreground" />
        <p class="ui:text-muted-foreground text-sm">
          {$t(isStudent ? 'ai_assistant.student_empty_state' : 'ai_assistant.empty_state')}
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        {#each quickActions as option (option.key)}
          <button
            onclick={() => onQuickAction(option.prompt)}
            class="ui:text-muted-foreground hover:ui:bg-muted cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors"
          >
            {$t(option.key)}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Message list -->
    <div class="flex flex-col gap-3">
      {#each messages as message, messageIndex (message.id)}
        {@const compaction = (message.metadata as AiAssistantMessageMetadata | undefined)?.compaction}
        {@const isLast = messageIndex === messages.length - 1}

        {#if compaction}
          <p class="ui:text-muted-foreground mx-1 px-2 text-[11px] leading-snug">
            {$t('ai_assistant.context_compacted_badge', { count: compaction.originalMessageCount })}
          </p>
        {/if}

        <MessageBubble
          {message}
          {messages}
          {courseId}
          {isStreaming}
          {isLast}
          {onImplementPlan}
          {onAskPlanChanges}
          {onSubmitTemplateAnswers}
          {onSkipTemplateForm}
          {onMentionClick}
        />
      {/each}

      {#if isStreaming && (isStudent || !planExecutionState)}
        <div class="flex items-start">
          <div class="ui:bg-muted rounded-lg px-3 py-2">
            <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
          </div>
        </div>
      {/if}

      {#if planExecutionState && !isStudent}
        <div class="mt-2">
          <ProgressCard
            titleKey={planExecutionState.titleKey}
            steps={planExecutionState.steps}
            currentActionLine={planExecutionState.currentActionLine}
            {courseId}
            onNavigate={onMentionClick}
            onStop={isStreaming ? onStop : undefined}
            isStopped={planExecutionState.isStopped}
          />
          {#if planExecutionState.isStopped}
            <Button size="sm" variant="outline" onclick={onResume} class="mt-2 w-full"
              >{$t('ai_assistant.resume')}</Button
            >
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
