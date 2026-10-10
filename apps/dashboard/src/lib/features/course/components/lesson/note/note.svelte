<script lang="ts">
  import { HTMLRender, TextEditor } from '$features/ui';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import type { Content, TiptapEditor } from '@cio/ui/custom/editor';
  import type { TLocale } from '@cio/db/types';
  import AIButton from '$features/course/components/lesson/ai-button.svelte';
  import QuoteSelection from '$features/course/components/lesson/note/quote-selection.svelte';
  import NoteCalloutPicker from '$features/course/components/lesson/note/note-callout-picker.svelte';
  import {
    noteCalloutFrameClass,
    noteCalloutMeta,
    type NoteCalloutStyle
  } from '$features/course/components/lesson/note/note-callout';
  import type { Writable } from 'svelte/store';
  import { saveDraft } from '$features/course/utils/lesson-draft';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
    lessonId?: string;
    isLoading?: Writable<boolean>;
    callAI?: (type: string) => void;
  }

  let { mode = MODES.view, lessonId = '', isLoading, callAI = () => {} }: Props = $props();

  let noteRoot: HTMLElement | undefined = $state();
  let editRoot: HTMLElement | undefined = $state();
  let calloutByLesson = $state<Record<string, NoteCalloutStyle>>({});

  const calloutStyle = $derived<NoteCalloutStyle>(calloutByLesson[lessonId] ?? '');
  const activeCallout = $derived(noteCalloutMeta(calloutStyle));
  const calloutFrameClass = $derived(noteCalloutFrameClass(calloutStyle));

  function setCalloutStyle(style: NoteCalloutStyle) {
    calloutByLesson[lessonId] = style;
  }

  $effect(() => {
    if (mode !== MODES.edit) {
      editRoot = undefined;
    }
  });

  function bindEditorRoot(editor: TiptapEditor) {
    editRoot = editor.view.dom as HTMLElement;
  }

  let hasAtLeastOneTranslation = $derived(
    Object.values(lessonApi.translations[lessonId] || {}).some((content) => {
      return content && !!content.length;
    })
  );

  function onEditorChange(content: Content) {
    if (mode === MODES.view) return;

    if (!lessonApi.translations[lessonId]) {
      lessonApi.translations[lessonId] = {} as Record<TLocale, string>;
    }
    lessonApi.translations[lessonId][lessonApi.currentLocale] = `${content}`;

    saveDraft(lessonId, lessonApi.currentLocale, `${content}`);
    lessonApi.markDirty();
  }

  const content = $derived(lessonApi.translations[lessonId]?.[lessonApi.currentLocale] || '');
</script>

{#snippet calloutToolbar()}
  <div class="ui:bg-border mx-1 h-4 w-px shrink-0" aria-hidden="true"></div>
  <NoteCalloutPicker value={calloutStyle} onChange={setCalloutStyle} />
{/snippet}

{#snippet calloutLabel()}
  {#if activeCallout}
    <div
      class="note-callout-label flex items-center gap-1.5 px-3.5 pt-2.5 text-[12.5px] font-bold {activeCallout.labelClass}"
    >
      <activeCallout.icon class="size-3.5" />
      <span>{$t(activeCallout.labelKey)}</span>
    </div>
  {/if}
{/snippet}

{#if mode === MODES.edit}
  <!-- AI Button -->
  <div class="flex justify-end gap-1">
    <AIButton {isLoading} {callAI} />
  </div>
  <!-- End AI Button -->

  <div class="mt-5 h-[60vh]">
    <TextEditor
      {content}
      onChange={(content) => onEditorChange(content)}
      onReady={bindEditorRoot}
      placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
      toolbarTrailing={calloutToolbar}
      contentLeading={calloutLabel}
      contentFrameClass={calloutFrameClass}
    />
  </div>
  <QuoteSelection root={editRoot} enabled />
{:else}
  <!-- View Mode -->
  {#if !isHtmlValueEmpty(content)}
    <div class="relative mx-auto w-full max-w-2xl" bind:this={noteRoot}>
      <HTMLRender>
        <SafeHtmlContent {content} />
      </HTMLRender>
      <QuoteSelection root={noteRoot} enabled />
    </div>
  {:else if hasAtLeastOneTranslation}
    <p class="text-md py-2 font-normal italic dark:text-white">
      {$t('course.navItem.lessons.materials.no_translation')}
    </p>
  {/if}
{/if}

<style>
  :global(.note-callout.note-callout-info) {
    background: color-mix(in oklab, oklch(0.6 0.15 250), transparent 92%);
    border-color: color-mix(in oklab, oklch(0.6 0.15 250), transparent 60%);
  }

  :global(.dark .note-callout.note-callout-info) {
    background: color-mix(in oklab, oklch(0.7 0.12 250), transparent 82%);
    border-color: color-mix(in oklab, oklch(0.7 0.12 250), transparent 55%);
  }

  :global(.note-callout.note-callout-tip) {
    background: color-mix(in oklab, oklch(0.6 0.14 160), transparent 92%);
    border-color: color-mix(in oklab, oklch(0.6 0.14 160), transparent 60%);
  }

  :global(.dark .note-callout.note-callout-tip) {
    background: color-mix(in oklab, oklch(0.72 0.12 160), transparent 82%);
    border-color: color-mix(in oklab, oklch(0.72 0.12 160), transparent 55%);
  }

  :global(.note-callout.note-callout-important) {
    background: color-mix(in oklab, var(--primary), transparent 92%);
    border-color: color-mix(in oklab, var(--primary), transparent 60%);
  }

  :global(.dark .note-callout.note-callout-important) {
    background: color-mix(in oklab, var(--primary), transparent 84%);
    border-color: color-mix(in oklab, var(--primary), transparent 55%);
  }

  :global(.note-callout.note-callout-warning) {
    background: color-mix(in oklab, oklch(0.7 0.16 70), transparent 88%);
    border-color: color-mix(in oklab, oklch(0.7 0.16 70), transparent 55%);
  }

  :global(.dark .note-callout.note-callout-warning) {
    background: color-mix(in oklab, oklch(0.75 0.14 70), transparent 80%);
    border-color: color-mix(in oklab, oklch(0.75 0.14 70), transparent 50%);
  }

  :global(.note-callout.note-callout-highlight) {
    background: color-mix(in oklab, oklch(0.8 0.17 95), transparent 82%);
    border-color: color-mix(in oklab, oklch(0.8 0.17 95), transparent 50%);
  }

  :global(.dark .note-callout.note-callout-highlight) {
    background: color-mix(in oklab, oklch(0.8 0.14 95), transparent 78%);
    border-color: color-mix(in oklab, oklch(0.8 0.14 95), transparent 48%);
  }
</style>
