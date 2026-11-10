<script lang="ts">
  import { mediaUploadManager } from '$features/media/api';
  import { currentOrg } from '$lib/utils/store/org';

  import MediaUploadDialog from './media-upload-dialog.svelte';
  import MediaUploadTray from './media-upload-tray.svelte';

  let uploadOrganizationId = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === uploadOrganizationId) return;

    const isOrganizationSwitch = uploadOrganizationId !== '';
    uploadOrganizationId = organizationId;

    if (isOrganizationSwitch) mediaUploadManager.cancelAll();
  });

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
