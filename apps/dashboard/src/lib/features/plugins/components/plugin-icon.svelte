<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import PuzzleIcon from '@lucide/svelte/icons/puzzle';

  interface Props {
    src?: string | null;
    alt?: string | null;
  }

  let { src = null, alt = null }: Props = $props();
</script>

<Avatar.Root class="size-5 rounded-md bg-transparent">
  {#if src}
    <Avatar.Image {src} {alt} class="rounded-md object-contain" />
  {/if}
  <Avatar.Fallback class="rounded-md bg-transparent">
    <PuzzleIcon class="size-5" aria-hidden="true" />
  </Avatar.Fallback>
</Avatar.Root>
