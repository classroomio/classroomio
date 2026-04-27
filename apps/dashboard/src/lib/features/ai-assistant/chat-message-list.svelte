<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { Button } from '@cio/ui/base/button';
  import MessageBubble from '$features/ai-assistant/message-bubble.svelte';
  import ProgressCard from '$features/ai-assistant/progress-card.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { ProgressStep } from '$features/ai-assistant/utils/tool-labels';
  import type { AiAssistantMessage } from '$features/ai-assistant/utils/types';

  interface PlanExecutionState {
    title: string;
    steps: ProgressStep[];
    currentAction?: string;
    isStopped: boolean;
  }

  interface Props {
    messages: AiAssistantMessage[];
    status: string;
    isStreaming: boolean;
    courseId: string;
    planExecutionState: PlanExecutionState | null;
    quickActions: string[];
    onQuickAction: (action: string) => void;
    onImplementPlan: (editedPlan: unknown) => void;
    onAskPlanChanges: () => void;
    onStop: () => void;
    onResume: () => void;
    onMentionClick: (route: string) => void;
  }

  let {
    messages,
    status,
    isStreaming,
    courseId,
    planExecutionState,
    quickActions,
    onQuickAction,
    onImplementPlan,
    onAskPlanChanges,
    onStop,
    onResume,
    onMentionClick
  }: Props = $props();

  let messagesContainer: HTMLDivElement | undefined = $state();
  let lastMessageCount = $state(0);
  let lastStepsCount = $state(0);
  let lastCurrentAction = $state('');

  const isEmpty = $derived(messages.length === 0);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    });
  }

  $effect(() => {
    if (!messagesContainer || messages.length === 0) return;

    if (messages.length === lastMessageCount) return;

    lastMessageCount = messages.length;
    scrollToBottom();
  });

  $effect(() => {
    if (!messagesContainer || !planExecutionState) return;

    const stepsCount = planExecutionState.steps.length;
    if (stepsCount !== lastStepsCount) {
      lastStepsCount = stepsCount;
      scrollToBottom();
      return;
    }

    const action = planExecutionState.currentAction ?? '';
    if (action !== lastCurrentAction) {
      lastCurrentAction = action;
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
          {$t('ai_assistant.empty_state')}
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        {#each quickActions as action (action)}
          <button
            onclick={() => onQuickAction(action)}
            class="ui:text-muted-foreground hover:ui:bg-muted cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors"
          >
            {action}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Message list -->
    <div class="flex flex-col gap-3">
      {#each messages as message (message.id)}
        <MessageBubble {message} {courseId} {onImplementPlan} {onAskPlanChanges} {onMentionClick} />
      {/each}

      {#if status === 'submitted' && isStreaming}
        <div class="flex items-start">
          <div class="ui:bg-muted rounded-lg px-3 py-2">
            <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
          </div>
        </div>
      {/if}

      {#if planExecutionState}
        <div class="mt-2">
          <ProgressCard
            title={planExecutionState.title}
            steps={planExecutionState.steps}
            currentAction={planExecutionState.currentAction}
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
