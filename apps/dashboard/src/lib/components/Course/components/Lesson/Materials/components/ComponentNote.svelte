<script lang="ts">
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { sanitizeHtml } from '$lib/utils/functions/sanitize';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import {
    lesson,
    lessonByTranslation
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { t } from '$lib/utils/functions/translations';
  import { lessonFallbackNote } from '$lib/utils/functions/translations';

  export let lessonId: string;

  $: content = lessonFallbackNote(
    $lesson.materials.note,
    $lessonByTranslation[lessonId],
    $lesson.locale
  );
  $: hasAtLeastOneTranslation = Object.values($lessonByTranslation[lessonId] || {}).some(
    (content) => {
      return content && !!content.length;
    }
  );
</script>

{#if !isHtmlValueEmpty(content)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html sanitizeHtml(content)}
      </div>
    </svelte:fragment>
  </HtmlRender>
{:else if hasAtLeastOneTranslation}
  <div class="flex flex-col items-center justify-center text-center">
    <h3 class="py-2 text-lg font-normal italic dark:text-white">
      {$t('course.navItem.lessons.materials.no_translation')}
    </h3>
  </div>
{/if}
