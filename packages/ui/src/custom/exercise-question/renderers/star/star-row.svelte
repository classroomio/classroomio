<script lang="ts">
  import Star from '@lucide/svelte/icons/star';

  let {
    maxStars,
    value,
    disabled = false,
    starLabel,
    onPick
  }: {
    maxStars: number;
    value: number;
    disabled?: boolean;
    starLabel: (starIndex: number) => string;
    onPick?: (starIndex: number) => void;
  } = $props();

  const starIndices = $derived(Array.from({ length: maxStars }, (_, index) => index + 1));
</script>

<div class="ui:flex ui:flex-wrap ui:items-center ui:gap-1" role="group">
  {#each starIndices as starIndex (starIndex)}
    {#if onPick && !disabled}
      <button
        type="button"
        class="ui:rounded-md ui:p-1 ui:text-amber-600 ui:transition-colors ui:hover:bg-amber-500/10 ui:focus-visible:ring-ring ui:outline-none ui:focus-visible:ring-2 ui:dark:text-amber-400"
        aria-label={starLabel(starIndex)}
        aria-pressed={value >= starIndex}
        {disabled}
        onclick={() => onPick(starIndex)}
      >
        <Star
          class="ui:size-8 {starIndex <= value
            ? 'ui:fill-amber-400 ui:text-amber-500 ui:dark:fill-amber-400 ui:dark:text-amber-300'
            : 'ui:fill-none ui:text-amber-200 ui:dark:text-amber-500/40'}"
        />
      </button>
    {:else}
      <span class="ui:inline-flex ui:p-1" aria-hidden="true">
        <Star
          class="ui:size-8 {starIndex <= value
            ? 'ui:fill-amber-400 ui:text-amber-500 ui:dark:fill-amber-400 ui:dark:text-amber-300'
            : 'ui:fill-none ui:text-amber-200 ui:dark:text-amber-500/40'}"
        />
      </span>
    {/if}
  {/each}
</div>
