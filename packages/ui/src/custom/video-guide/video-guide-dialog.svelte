<script lang="ts">
  import { Button } from '../../base/button';
  import * as Dialog from '../../base/dialog';
  import { getVideoGuideEmbedUrl } from './utils';

  interface Props {
    open?: boolean;
    videoId: string;
    title: string;
    closeLabel?: string;
    testId?: string;
  }

  let { open = $bindable(false), videoId, title, closeLabel = 'Close', testId }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="ui:max-h-[92dvh] ui:w-[96vw] ui:max-w-4xl! ui:gap-0 ui:overflow-x-hidden ui:overflow-y-auto ui:p-0"
    showCloseButton={false}
    data-testid={testId}
  >
    <div class="ui:bg-muted ui:w-full ui:aspect-video">
      {#if open}
        <iframe
          class="ui:size-full"
          src={getVideoGuideEmbedUrl(videoId)}
          {title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      {/if}
    </div>

    <div class="ui:flex ui:items-center ui:justify-between ui:gap-4 ui:px-5 ui:py-3">
      <Dialog.Title class="ui:text-base ui:font-semibold">{title}</Dialog.Title>
      <Button
        size="sm"
        variant="outline"
        testId={testId ? `${testId}-close` : undefined}
        onclick={() => (open = false)}
      >
        {closeLabel}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
