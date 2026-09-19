<script lang="ts">
  import Share2Icon from '@lucide/svelte/icons/share-2';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import ShareMenu from './share-menu.svelte';
  import type { ShareActionLabels } from './share-utils';

  interface Props {
    pageUrl: string;
    pageTitle: string;
    labels: ShareActionLabels;
    onInstagramCopied?: () => void;
    class?: string;
  }

  let { pageUrl, pageTitle, labels, onInstagramCopied, class: className }: Props = $props();
</script>

<ShareMenu {pageUrl} {pageTitle} {labels} {onInstagramCopied}>
  {#snippet trigger({ props })}
    <Button
      {...props}
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={labels.share}
      class={cn(props.class, className)}
    >
      <Share2Icon class="ui:size-3.5" aria-hidden="true" />
    </Button>
  {/snippet}
</ShareMenu>
