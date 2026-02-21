<script lang="ts">
  import { useFileDropZone } from './file-drop-zone-util.svelte';
  import type { FileDropZoneRootProps } from './types';
  import { box } from 'svelte-toolbelt';

  const uid = $props.id();
  let {
    id = uid,
    maxFiles,
    maxFileSize,
    fileCount,
    disabled = false,
    onUpload,
    onFileRejected,
    accept,
    children,
    ...rest
  }: FileDropZoneRootProps = $props();

  const rootState = useFileDropZone({
    id: box.with(() => id),
    disabled: box.with(() => disabled ?? false),
    onUpload: box.with(() => onUpload),
    maxFiles: box.with(() => maxFiles),
    fileCount: box.with(() => fileCount),
    maxFileSize: box.with(() => maxFileSize),
    onFileRejected: box.with(() => onFileRejected),
    accept: box.with(() => accept)
  });
</script>

<input class="ui:hidden" {...rootState.props} {...rest} />

{@render children?.()}
