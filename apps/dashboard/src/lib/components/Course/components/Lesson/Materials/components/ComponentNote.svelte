<script lang="ts">
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import {
    lesson,
    lessonByLocaleNote
  } from '$lib/components/Course/components/Lesson/store/lessons';

  export let lessonId: string;

  $: content = $lessonByLocaleNote[lessonId]
    ? $lessonByLocaleNote[lessonId][$lesson.locale]
    : $lesson.materials.note;
</script>

{#if !isHtmlValueEmpty(content)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html content}
      </div>
    </svelte:fragment>
  </HtmlRender>
{/if}
