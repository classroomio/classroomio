<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { useFileDropZoneTextarea } from './file-drop-zone-util.svelte';
  import { box, mergeProps } from 'svelte-toolbelt';
  import type { WithChild } from 'bits-ui';

  type Props = HTMLAttributes<HTMLTextAreaElement>;

  let { onpaste, ondragover, ondrop, child, ...rest }: WithChild & Props = $props();

  const fileDropZoneTextareaState = useFileDropZoneTextarea({
    onpaste: box.with(() => onpaste),
    ondragover: box.with(() => ondragover),
    ondrop: box.with(() => ondrop)
  });

  const mergedProps = $derived(mergeProps(fileDropZoneTextareaState.props, rest));
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <textarea {...mergedProps}></textarea>
{/if}
