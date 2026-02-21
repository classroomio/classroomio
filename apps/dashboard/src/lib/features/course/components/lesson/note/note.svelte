<script lang="ts">
  import { HTMLRender, TextEditor } from '$features/ui';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import type { Content } from '@cio/ui/custom/editor';
  import type { TLocale } from '@cio/db/types';
  import AIButton from '$features/course/components/lesson/ai-button.svelte';
  import type { Writable } from 'svelte/store';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
    lessonId?: string;
    isLoading?: Writable<boolean>;
    callAI?: (type: string) => void;
  }

  let { mode = MODES.view, lessonId = '', isLoading, callAI = () => {} }: Props = $props();

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

    try {
      localStorage.setItem(`lesson-${lessonId}-${lessonApi.currentLocale}`, `${content}`);
    } catch (error) {
      console.error('Error saving lesson note to localStorage', error);
    }

    lessonApi.isDirty = true;
  }

  const content = $derived(lessonApi.translations[lessonId]?.[lessonApi.currentLocale] || '');

  $effect(() => {
    console.log('content', content);
  });
  $effect(() => {
    console.log('lessonApi.currentLocale', lessonApi.currentLocale);
  });
</script>

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
      placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
    />
  </div>
{:else}
  <!-- View Mode -->
  {#if !isHtmlValueEmpty(content)}
    <HTMLRender>
      {@html sanitizeHtml(content)}
    </HTMLRender>
  {:else if hasAtLeastOneTranslation}
    <p class="text-md py-2 font-normal italic dark:text-white">
      {$t('course.navItem.lessons.materials.no_translation')}
    </p>
  {/if}
{/if}
