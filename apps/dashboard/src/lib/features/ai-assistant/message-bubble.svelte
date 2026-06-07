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
  import TemplateFormCard from '$features/ai-assistant/template-form-card.svelte';
  import { isTemplateFormResolved } from '$features/ai-assistant/utils/template-form-resolved';
  import { mergeTemplateFieldsWithRegistry } from '$features/ai-assistant/utils/template-fields';
  import ToolLine from '$features/ai-assistant/utils/tool-line.svelte';
  import {
    getCompletedToolLine,
    getPendingToolI18nKey,
    getPendingToolI18nVars,
    getPendingToolLine
  } from '$features/ai-assistant/utils/tool-labels';
  import type { CoursePlan } from '$features/ai-assistant/utils/course-plan';
  import { t } from '$lib/utils/functions/translations';
  import {
    getAgentToolName,
    getAgentToolInput,
    getAgentToolResult,
    getAgentToolStatus,
    isAgentToolPart
  } from '$features/ai-assistant/utils/tool-parts';
  import type { AiAssistantMessage, AiAssistantMessageMetadata } from '$features/ai-assistant/utils/types';
  import type { CourseTemplateId, TemplateFormField } from '@cio/ai-assistant';

  interface Props {
    message: AiAssistantMessage;
    messages: AiAssistantMessage[];
    courseId: string;
    onImplementPlan: (editedPlan: unknown) => void;
    onAskPlanChanges: (message: string) => void;
    isStreaming: boolean;
    isLast?: boolean;
    /** When true, historical PlanView cards default to their collapsed form. */
    planShouldCollapse?: boolean;
    onSubmitTemplateAnswers: (payload: {
      templateId: CourseTemplateId;
      answers: Record<string, string>;
      fields: TemplateFormField[];
    }) => void;
    onSkipTemplateForm: (payload: { templateId: CourseTemplateId }) => void;
    onMentionClick: (route: string) => void;
  }

  let {
    message,
    messages,
    courseId,
    onImplementPlan,
    onAskPlanChanges,
    onSubmitTemplateAnswers,
    onSkipTemplateForm,
    onMentionClick,
    isStreaming,
    isLast = false,
    planShouldCollapse = false
  }: Props = $props();

  /**
   * Collapse a PlanView card when implementation has started anywhere in the
   * conversation OR when newer assistant messages have pushed it back. The
   * very first plan card the teacher sees stays expanded.
   */
  const planCardDefaultCollapsed = $derived(planShouldCollapse || !isLast);

  function localizePendingTool(toolName: string): string {
    const vars = getPendingToolI18nVars(toolName);
    const key = getPendingToolI18nKey(toolName);

    return t.get(key, vars ?? {});
  }

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

  /** Tool parts rendered in a second pass so narrative text always appears above them (stream order often emits tools first). */
  function isDeferredPlanPart(part: Record<string, unknown>) {
    if (!isAgentToolPart(part)) {
      return false;
    }

    const name = getAgentToolName(part);

    return name === 'generate_course_plan' || name === 'ask_template_questions';
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

  const inlineParts = $derived((message.parts ?? []).filter((part) => (part as { type?: string }).type === 'text'));
  const deferredPlanParts = $derived(
    (message.parts ?? []).filter((part) => isDeferredPlanPart(part as Record<string, unknown>))
  );
  const hasBubbleContent = $derived(inlineParts.length > 0 || deferredPlanParts.length > 0 || !!messageAttachment);
  const showStreamingSpinner = $derived(message.role === 'assistant' && !hasBubbleContent && isStreaming && isLast);
</script>

<div data-role={message.role} class="flex flex-col gap-1 {message.role === 'user' ? 'items-end' : 'items-start'}">
  {#if message.role === 'assistant' && !hasBubbleContent && !showStreamingSpinner}
    <!-- Assistant message has no renderable parts yet and isn't streaming — skip the empty bubble -->
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="max-w-[90%] rounded-lg px-3 py-2 text-sm {message.role === 'user'
        ? 'ui:bg-primary ui:text-primary-foreground'
        : 'ui:bg-muted'}"
      onclick={handleBubbleClick}
    >
      {#if showStreamingSpinner}
        <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
      {/if}
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
            class="ai-chat-prose prose prose-sm dark:prose-invert max-w-none break-all {message.role === 'user' &&
              'ui:text-primary-foreground!'}"
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html renderMentions(renderMarkdown(part.text as string), courseId)}
          </div>
        {/if}
      {/each}

      {#each deferredPlanParts as part, partIndex (partIndex)}
        {@const toolName = getAgentToolName(part)}
        {@const toolResult = getAgentToolResult(part)}
        {@const toolStatus = getAgentToolStatus(part)}
        {@const errorText = getPartErrorText(part)}
        {#if toolName === 'generate_course_plan' && toolStatus === 'completed'}
          <div class="mt-3">
            <PlanView
              plan={toolResult as CoursePlan}
              onImplement={onImplementPlan}
              onAskChanges={onAskPlanChanges}
              isBusy={isStreaming}
              defaultCollapsed={planCardDefaultCollapsed}
            />
          </div>
        {:else if toolName === 'ask_template_questions' && (toolStatus === 'completed' || toolStatus === 'in_progress')}
          {@const merged = (toolResult ?? getAgentToolInput(part)) as
            | { templateId?: CourseTemplateId; fields?: TemplateFormField[] }
            | undefined}
          {#if merged?.templateId}
            {@const canonicalFields = mergeTemplateFieldsWithRegistry(merged.templateId, merged.fields)}
            {#if canonicalFields.length > 0}
              <div class="mt-3">
                <TemplateFormCard
                  templateId={merged.templateId}
                  fields={canonicalFields}
                  allMessages={messages}
                  submitted={isTemplateFormResolved(messages, merged.templateId)}
                  disableFormInputs={toolStatus === 'in_progress'}
                  onSubmit={onSubmitTemplateAnswers}
                  onSkip={onSkipTemplateForm}
                />
              </div>
            {/if}
          {/if}
        {:else}
          <div class="ui:bg-background/70 mt-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
            {#if toolStatus === 'completed' && toolName}
              <CheckIcon size={12} class="ui:text-primary shrink-0" />
              <ToolLine line={getCompletedToolLine(toolName, toolResult)} {courseId} onNavigate={onMentionClick} />
            {:else if toolStatus === 'failed' && toolName}
              <AlertCircleIcon size={12} class="shrink-0 text-red-500" />
              <span class="min-w-0 flex-1 truncate text-red-600 dark:text-red-400">
                {#if errorText}
                  {truncateErrorText(errorText)}
                {:else}
                  {$t('ai_assistant.run_failed_after', { action: localizePendingTool(toolName) })}
                {/if}
              </span>
              {#if errorText}
                <button
                  type="button"
                  class="ui:text-muted-foreground ml-1 shrink-0 cursor-pointer hover:text-red-500"
                  title={$t('ai_assistant.copy_full_error')}
                  onclick={() => copyToClipboard(errorText)}
                >
                  <CopyIcon size={11} />
                </button>
              {/if}
            {:else if toolStatus === 'in_progress' && toolName}
              <LoaderIcon size={12} class="ui:text-primary shrink-0 animate-spin" />
              <ToolLine line={getPendingToolLine(toolName)} {courseId} onNavigate={onMentionClick} />
            {:else}
              <CircleIcon size={12} class="ui:text-muted-foreground shrink-0" />
              {#if toolName}
                <span class="ui:text-muted-foreground">
                  <ToolLine line={getPendingToolLine(toolName)} {courseId} onNavigate={onMentionClick} />
                </span>
              {:else}
                <span class="ui:text-muted-foreground">{$t('ai_assistant.generic_working')}</span>
              {/if}
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
  {/if}
</div>

<style>
  /* Reset global `apps/dashboard/src/app.css` `.prose p { mb-4 }` for chat bubbles */
  :global(.ai-chat-prose.prose p) {
    margin-bottom: 0;
  }

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

  :global([data-role='user'] a),
  :global([data-role='user'] .prose a) {
    color: var(--primary-foreground);
  }

  :global([data-role='user'] .prose code:not(pre code)) {
    color: rgb(9 9 11);
    background-color: rgb(255 255 255 / 0.95);
  }

  :global(.mention-link:hover) {
    opacity: 0.8;
  }
</style>
