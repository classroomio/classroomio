<script lang="ts">
  import { getCourseTypeMeta } from '../utils';

  let { courseType }: { courseType: string | null | undefined } = $props();
  const meta = $derived(getCourseTypeMeta(courseType));
</script>

{#if meta}
  <span class={meta.className}>{meta.label}</span>
{/if}
