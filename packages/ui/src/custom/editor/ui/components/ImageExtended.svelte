<script lang="ts">
  import type { NodeViewProps } from '@tiptap/core';
  import MediaExtended from './MediaExtended.svelte';

  const { ...rest }: NodeViewProps = $props();

  let mediaRef = $state<HTMLElement>();
</script>

<MediaExtended bind:mediaRef {...rest}>
  {@const node = rest.node}
  <img
    bind:this={mediaRef}
    src={node.attrs.src}
    alt={node.attrs.alt}
    title={node.attrs.title}
    class="ui:m-0 ui:object-cover"
  />
</MediaExtended>
