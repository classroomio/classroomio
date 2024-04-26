<script lang="ts">
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
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
  $: hasAtLeastOneTranslation = Object.values($lessonByTranslation[lessonId]).some(
    (c) => !!c.length
  );
</script>

{#if !isHtmlValueEmpty(content)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html content}
      </div>
    </svelte:fragment>
  </HtmlRender>
{:else if hasAtLeastOneTranslation}
  <div class="flex items-center justify-center flex-col text-center">
    <h3 class="text-lg font-normal italic dark:text-white py-2">
      {$t('course.navItem.lessons.materials.no_translation')}
    </h3>
  </div>
{/if}
