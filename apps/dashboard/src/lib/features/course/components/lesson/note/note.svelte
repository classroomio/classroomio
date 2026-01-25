<script lang="ts">
  import { HTMLRender, TextEditor } from '$features/ui';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import type { Content } from '@cio/ui/custom/editor';
  import type { TLocale } from '@cio/db/types';
  import { AIButton } from '../components';
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
</script>

{#if mode === MODES.edit}
  <!-- AI Button -->
  <div class="flex justify-end gap-1">
    <AIButton {isLoading} {callAI} />
  </div>
  <!-- End AI Button -->

  <div class="mt-5 h-[60vh]">
    <TextEditor
      content={lessonApi.note}
      onChange={(content) => onEditorChange(content)}
      onReady={() => {
        // editor
      }}
      placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
    />
  </div>
{:else}
  <!-- View Mode -->
  {#if !isHtmlValueEmpty(lessonApi.note)}
    <HTMLRender className="m-auto">
      <div>
        {@html sanitizeHtml(lessonApi.note)}
      </div>
    </HTMLRender>
  {:else if hasAtLeastOneTranslation}
    <div class="flex flex-col items-center justify-center text-center">
      <h3 class="py-2 text-lg font-normal italic dark:text-white">
        {$t('course.navItem.lessons.materials.no_translation')}
      </h3>
    </div>
  {/if}
{/if}
