<script lang="ts">
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
</script>

{#if !isHtmlValueEmpty($lesson.materials?.note)}
  <HtmlRender className="m-auto">
    <svelte:fragment slot="content">
      <div>
        {@html $lesson.materials.note}
      </div>
    </svelte:fragment>
  </HtmlRender>
{/if}
