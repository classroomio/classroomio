<script lang="ts">
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';

  function isNoteEmpty(note) {
    if (!note || typeof note !== 'string') return true;

    if (!document) return false;

    const dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = note;

    const rawText = dummyDiv.textContent?.trim();

    return rawText === '';
  }
</script>

{#if !isNoteEmpty($lesson.materials?.note)}
  <div>
    {@html $lesson.materials.note}
  </div>
{/if}
