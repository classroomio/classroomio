<script lang="ts">
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';

  function isNoteEmpty(note: string) {
    if (!note || typeof note !== 'string') return true;

    if (!document) return false;

    const dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = note;

    const rawText = dummyDiv.textContent?.trim();

    return rawText === '';
  }
</script>

{#if !isNoteEmpty($lesson.materials?.note)}
  <HtmlRender>
    <svelte:fragment slot="content">
      <div>
        {@html $lesson.materials.note}
      </div>
    </svelte:fragment>
  </HtmlRender>
{/if}
