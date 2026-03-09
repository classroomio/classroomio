<script lang="ts">
  import * as Item from '../../base/item';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Document/file title (e.g. filename) */
    title: string;
    /** Optional subtitle (e.g. file type and size) */
    subtitle?: string;
    /** Optional presigned URL for View/Download links. When provided, renders View and Download links unless `actions` slot is used. */
    fileUrl?: string | null;
    /** Label for the View link. Default: "View" */
    viewLabel?: string;
    /** Label for the Download link. Default: "Download" */
    downloadLabel?: string;
    /** Optional slot for custom actions (e.g. lesson document buttons). When provided, replaces the default View/Download links. */
    actions?: Snippet;
    /** Optional content to render before the actions (e.g. edit mode dropdown) */
    header?: Snippet;
    class?: string;
  }

  let {
    title,
    subtitle = '',
    fileUrl = null,
    viewLabel = 'View',
    downloadLabel = 'Download',
    actions,
    header,
    class: className = ''
  }: Props = $props();
</script>

<Item.Root variant="outline" class="ui:w-fit! ui:min-w-0 ui:cursor-default! ui:p-3! {className}">
  <div class="ui:flex ui:w-full ui:min-w-0 ui:flex-col">
    {#if header}
      {@render header()}
    {/if}

    <Item.Header>
      <Item.Media variant="icon" class="ui:size-14! ui:[&_svg]:size-8!" aria-label={title}>
        <FileTextIcon class="ui:text-muted-foreground" />
      </Item.Media>
    </Item.Header>

    <Item.Content class="ui:w-full! ui:min-w-0">
      <Item.Title class="ui:line-clamp-2 ui:min-h-[44px] ui:text-base!" {title}>
        <span class="ui:max-w-[200px] ui:truncate ui:break-all">{title}</span>
      </Item.Title>
      {#if subtitle}
        <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">{subtitle}</p>
      {/if}

      {#if actions || fileUrl}
        <div class="ui:mt-3 ui:flex ui:w-full ui:min-w-0 ui:gap-2">
          {#if actions}
            {@render actions()}
          {:else if fileUrl}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="ui:border-input ui:bg-background ui:text-foreground hover:ui:bg-accent hover:ui:text-accent-foreground ui:shrink ui:inline-flex ui:items-center ui:gap-1.5 ui:rounded-md ui:border ui:px-3 ui:py-1.5 ui:text-sm ui:font-medium"
            >
              {viewLabel}
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={title}
              class="ui:border-input ui:bg-background ui:text-foreground hover:ui:bg-accent hover:ui:text-accent-foreground ui:shrink ui:inline-flex ui:items-center ui:gap-1.5 ui:rounded-md ui:border ui:px-3 ui:py-1.5 ui:text-sm ui:font-medium"
            >
              <DownloadIcon class="ui:size-4" />
              {downloadLabel}
            </a>
          {/if}
        </div>
      {/if}
    </Item.Content>
  </div>
</Item.Root>
