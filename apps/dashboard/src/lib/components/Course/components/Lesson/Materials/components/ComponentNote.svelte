<script lang="ts">
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import {
    lesson,
    lessonByTranslation
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import Box from '$lib/components/Box/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import AlignBoxTopLeft from 'carbon-icons-svelte/lib/AlignBoxTopLeft.svelte';
  import { lessonFallbackNote } from '$lib/utils/functions/translations';

  export let lessonId: string;

  $: content = lessonFallbackNote(
    $lesson.materials.note,
    $lessonByTranslation[lessonId],
    $lesson.locale
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
{:else}
  <Box className="text-center">
    <AlignBoxTopLeft class="carbon-icon" size={32} />
    <h3 class="text-xl font-normal dark:text-white py-2">
      {$t('course.navItem.lessons.materials.no_translation')}
    </h3>
  </Box>
{/if}
