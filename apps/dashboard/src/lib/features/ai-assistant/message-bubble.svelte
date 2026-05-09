<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { renderMarkdown } from '$features/ai-assistant/utils/markdown';
  import { renderMentions } from '$features/ai-assistant/utils/mentions';
  import PlanView from '$features/ai-assistant/plan-view.svelte';
  import { getToolLabel, getToolResultLabel } from '$features/ai-assistant/utils/tool-labels';
  import type { CoursePlan } from '$features/ai-assistant/utils/course-plan';
  import { t } from '$lib/utils/functions/translations';
  import {
    getAgentToolName,
    getAgentToolResult,
    getAgentToolStatus,
    isAgentToolPart
  } from '$features/ai-assistant/utils/tool-parts';
  import type { AiAssistantMessage, AiAssistantMessageMetadata } from '$features/ai-assistant/utils/types';

  interface Props {
    message: AiAssistantMessage;
    courseId: string;
    onImplementPlan: (editedPlan: unknown) => void;
    onAskPlanChanges: () => void;
    onMentionClick: (route: string) => void;
  }

  let { message, courseId, onImplementPlan, onAskPlanChanges, onMentionClick }: Props = $props();

  function handleBubbleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const mentionLink = target.closest('[data-mention-route]') as HTMLElement | null;

    if (mentionLink) {
      event.preventDefault();
      const route = mentionLink.dataset.mentionRoute;

      if (route) {
        onMentionClick(route);
      }
    }
  }

  const messageAttachment = $derived((message.metadata as AiAssistantMessageMetadata | undefined)?.attachment);
  const tokenUsage = $derived((message.metadata as AiAssistantMessageMetadata | undefined)?.tokenUsage);

  function isDeferredPlanPart(part: Record<string, unknown>) {
    if (!isAgentToolPart(part)) {
      return false;
    }

    return getAgentToolName(part) === 'generate_course_plan';
  }

  function truncateErrorText(errorText: string): string {
    // Show just the summary before the raw Value JSON dump
    const valueIndex = errorText.indexOf(' Value: ');
    if (valueIndex !== -1) {
      return errorText.slice(0, valueIndex);
    }

    return errorText.length > 120 ? errorText.slice(0, 120) + '…' : errorText;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function getPartErrorText(part: unknown): string | undefined {
    return (part as { errorText?: string }).errorText;
  }

  const inlineParts = $derived(message.parts.filter((part) => !isDeferredPlanPart(part as Record<string, unknown>)));
  const deferredPlanParts = $derived(
    message.parts.filter((part) => isDeferredPlanPart(part as Record<string, unknown>))
  );
</script>

<div data-role={message.role} class="flex flex-col gap-1 {message.role === 'user' ? 'items-end' : 'items-start'}">
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="max-w-[90%] rounded-lg px-3 py-2 text-sm {message.role === 'user'
      ? 'ui:bg-primary ui:text-primary-foreground'
      : 'ui:bg-muted'}"
    onclick={handleBubbleClick}
  >
    {#if messageAttachment}
      <div
        class="mb-2 flex items-center gap-2 rounded-md px-2 py-1 text-xs {message.role === 'user'
          ? 'bg-white/15 text-white/90'
          : 'ui:bg-background/70 ui:text-muted-foreground'}"
      >
        <FileTextIcon size={12} class="shrink-0" />
        <span class="min-w-0 truncate">{messageAttachment.name}</span>
      </div>
    {/if}

    {#each inlineParts as part, partIndex (partIndex)}
      {#if part.type === 'text'}
        <div
          class="prose prose-sm dark:prose-invert max-w-none {message.role === 'user' && 'ui:text-primary-foreground!'}"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html renderMentions(renderMarkdown(part.text as string), courseId)}
        </div>
      {:else if isAgentToolPart(part)}
        {@const toolName = getAgentToolName(part)}
        {@const toolResult = getAgentToolResult(part)}
        {@const toolStatus = getAgentToolStatus(part)}
        {@const errorText = getPartErrorText(part)}
        {#if toolName === 'generate_course_plan' && toolStatus === 'completed'}
          <PlanView plan={toolResult as CoursePlan} onImplement={onImplementPlan} onAskChanges={onAskPlanChanges} />
        {:else}
          <div class="ui:bg-background/70 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
            {#if toolStatus === 'completed' && toolName}
              <CheckIcon size={12} class="ui:text-primary shrink-0" />
              <span>{getToolResultLabel(toolName, toolResult)}</span>
            {:else if toolStatus === 'failed' && toolName}
              <AlertCircleIcon size={12} class="shrink-0 text-red-500" />
              <span class="min-w-0 flex-1 truncate text-red-600 dark:text-red-400">
                {errorText ? truncateErrorText(errorText) : `${getToolLabel(toolName)} failed`}
              </span>
              {#if errorText}
                <button
                  type="button"
                  class="ui:text-muted-foreground ml-1 shrink-0 cursor-pointer hover:text-red-500"
                  title="Copy full error"
                  onclick={() => copyToClipboard(errorText)}
                >
                  <CopyIcon size={11} />
                </button>
              {/if}
            {:else if toolStatus === 'in_progress' && toolName}
              <LoaderIcon size={12} class="ui:text-primary shrink-0 animate-spin" />
              <span>{getToolLabel(toolName)}</span>
            {:else}
              <CircleIcon size={12} class="ui:text-muted-foreground shrink-0" />
              <span class="ui:text-muted-foreground">{toolName ? getToolLabel(toolName) : 'Working'}</span>
            {/if}
          </div>
        {/if}
      {/if}
    {/each}

    {#each deferredPlanParts as part, partIndex (partIndex)}
      {@const toolName = getAgentToolName(part)}
      {@const toolResult = getAgentToolResult(part)}
      {@const toolStatus = getAgentToolStatus(part)}
      {@const errorText = getPartErrorText(part)}
      {#if toolName === 'generate_course_plan' && toolStatus === 'completed'}
        <div class="mt-3">
          <PlanView plan={toolResult as CoursePlan} onImplement={onImplementPlan} onAskChanges={onAskPlanChanges} />
        </div>
      {:else}
        <div class="ui:bg-background/70 mt-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
          {#if toolStatus === 'completed' && toolName}
            <CheckIcon size={12} class="ui:text-primary shrink-0" />
            <span>{getToolResultLabel(toolName, toolResult)}</span>
          {:else if toolStatus === 'failed' && toolName}
            <AlertCircleIcon size={12} class="shrink-0 text-red-500" />
            <span class="min-w-0 flex-1 truncate text-red-600 dark:text-red-400">
              {errorText ? truncateErrorText(errorText) : `${getToolLabel(toolName)} failed`}
            </span>
            {#if errorText}
              <button
                type="button"
                class="ui:text-muted-foreground ml-1 shrink-0 cursor-pointer hover:text-red-500"
                title="Copy full error"
                onclick={() => copyToClipboard(errorText)}
              >
                <CopyIcon size={11} />
              </button>
            {/if}
          {:else if toolStatus === 'in_progress' && toolName}
            <LoaderIcon size={12} class="ui:text-primary shrink-0 animate-spin" />
            <span>{getToolLabel(toolName)}</span>
          {:else}
            <CircleIcon size={12} class="ui:text-muted-foreground shrink-0" />
            <span class="ui:text-muted-foreground">{toolName ? getToolLabel(toolName) : 'Working'}</span>
          {/if}
        </div>
      {/if}
    {/each}

    {#if message.role === 'assistant' && tokenUsage}
      <div class="mt-1 flex justify-end">
        <span class="ui:text-muted-foreground text-[10px]">
          {tokenUsage.totalTokens.toLocaleString()}
          {$t('ai_assistant.tokens_label')}
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.mention-link) {
    display: inline;
    cursor: pointer;
    font-weight: 500;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
    border-radius: 0.125rem;
    transition: opacity 0.15s;
  }

  :global([data-role='user'] a) {
    color: var(--primary-foreground);
  }

  :global(.mention-link:hover) {
    opacity: 0.8;
  }
</style>
