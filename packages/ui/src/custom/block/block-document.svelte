<script lang="ts">
  import {
    AttachmentList,
    formatFileSize,
    type AttachmentListFile,
    type AttachmentListLabels
  } from '../attachment-list';
  import ChangeButton from './block-change-button.svelte';

  const defaultLabels: AttachmentListLabels = {
    title: 'Attachments',
    fileCount: '',
    view: 'View file',
    download: 'Download file',
    delete: 'Delete file',
    reorder: 'Reorder file'
  };

  interface Props {
    files: AttachmentListFile[];
    editable?: boolean;
    changeLabel?: string;
    labels?: AttachmentListLabels;
    onView?: (file: AttachmentListFile) => void;
    onDownload?: (file: AttachmentListFile) => void | Promise<void>;
    onChange?: () => void;
  }

  let { files, editable = false, changeLabel, labels = defaultLabels, onView, onDownload, onChange }: Props = $props();
</script>

<div class="ui:group/document ui:relative ui:w-full">
  <AttachmentList
    mode={editable ? 'edit' : 'view'}
    {files}
    {labels}
    formatSize={formatFileSize}
    {onView}
    {onDownload}
  />

  {#if editable && changeLabel && onChange}
    <div
      class="ui:absolute ui:top-0 ui:right-0 ui:opacity-100 ui:transition ui:focus-within:opacity-100 ui:sm:opacity-0 ui:sm:group-hover/document:opacity-100"
    >
      <ChangeButton label={changeLabel} onclick={onChange} />
    </div>
  {/if}
</div>
