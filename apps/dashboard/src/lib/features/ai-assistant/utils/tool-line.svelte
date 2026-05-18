<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ToolLineUi } from '$features/ai-assistant/utils/tool-labels';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    line: ToolLineUi;
    courseId: string;
    onNavigate: (route: string) => void;
  }

  let { line, courseId, onNavigate }: Props = $props();

  function lessonPath(lessonId: string): string {
    return resolve(`/courses/${courseId}/lessons/${lessonId}`, {});
  }

  function exercisePath(exerciseId: string): string {
    return resolve(`/courses/${courseId}/exercises/${exerciseId}`, {});
  }

  function landingPageEditorPath(): string {
    return resolve(`/courses/${courseId}/landingpage`, {});
  }
</script>

{#if line.shape === 'i18n'}
  {$t(line.key, line.vars ?? {})}
{:else if line.shape === 'lesson_written'}
  <span class="inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
    <button
      type="button"
      class="mention-link max-w-[14rem] truncate text-left font-medium"
      onclick={() => onNavigate(lessonPath(line.lessonId))}
    >
      {line.title}
    </button>
    <span class="ui:text-muted-foreground font-normal"
      >{$t('ai_assistant.tool.meta.lesson_char_count', { count: line.charCount })}</span
    >
  </span>
{:else if line.shape === 'exercise_questions'}
  <span class="inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
    <button
      type="button"
      class="mention-link max-w-[14rem] truncate text-left font-medium"
      onclick={() => onNavigate(exercisePath(line.exerciseId))}
    >
      {line.title}
    </button>
    <span class="ui:text-muted-foreground font-normal">
      {#if line.action === 'added'}
        {$t('ai_assistant.tool.meta.exercise_questions_added', { count: line.count })}
      {:else}
        {$t('ai_assistant.tool.meta.exercise_questions_updated', { count: line.count })}
      {/if}
    </span>
  </span>
{:else if line.shape === 'landing_page_updated'}
  <span class="inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
    <button
      type="button"
      class="mention-link max-w-[14rem] truncate text-left font-medium"
      onclick={() => onNavigate(landingPageEditorPath())}
    >
      {line.title ? line.title : $t('course.navItems.nav_landing_page')}
    </button>
    <span class="ui:text-muted-foreground font-normal">{$t('ai_assistant.tool.meta.landing_page_preview')}</span>
  </span>
{/if}

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
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
  }

  :global(.mention-link:hover) {
    opacity: 0.85;
  }
</style>
