<script lang="ts">
  import type { NodeViewProps } from '@tiptap/core';
  import MediaExtended from './MediaExtended.svelte';

  const { ...rest }: NodeViewProps = $props();

  let mediaRef = $state<HTMLElement>();
</script>

<MediaExtended bind:mediaRef {...rest}>
  {@const node = rest.node}
  <iframe bind:this={mediaRef} class="ui:m-0 ui:w-full" {...node.attrs}> </iframe>
</MediaExtended>
