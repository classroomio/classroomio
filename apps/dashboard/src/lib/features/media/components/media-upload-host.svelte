<script lang="ts">
  import { mediaUploadManager } from '$features/media/api';

  import MediaUploadDialog from './media-upload-dialog.svelte';
  import MediaUploadTray from './media-upload-tray.svelte';

  function warnBeforeLeaving(event: BeforeUnloadEvent) {
    if (!mediaUploadManager.isUploading) return;

    event.preventDefault();
  }
</script>

<svelte:window onbeforeunload={warnBeforeLeaving} />

<MediaUploadDialog />

{#if mediaUploadManager.view === 'minimized'}
  <MediaUploadTray />
{/if}
