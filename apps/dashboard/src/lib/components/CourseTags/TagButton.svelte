<script lang="ts">
  import type { CourseTag } from '$lib/utils/types';
  import { Add, Close } from 'carbon-icons-svelte';

  export let tag: CourseTag;
  export let isAdd = false;
  export let isRemove = false;
  export let handleTag: ((tag: CourseTag) => void) | undefined = undefined;
</script>

<button
  type="button"
  on:click={() => handleTag && handleTag(tag)}
  class="flex items-center gap-2 rounded-sm border bg-gray-50 px-3 py-1 text-xs dark:bg-transparent dark:text-white"
>
  {#if isAdd}
    <Add />
  {:else if isRemove}
    <Close />
  {/if}
  {tag.name}
</button>
