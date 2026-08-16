<script lang="ts">
  import CopyIcon from '@lucide/svelte/icons/copy';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { siClaude } from 'simple-icons';
  import { Button } from '../../base/button';
  import * as ButtonGroup from '../../base/button-group';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { UseClipboard } from '../../hooks/use-clipboard.svelte';
  import { cn } from '../../tools';
  import { CHATGPT_ICON_PATH } from './copy-page-icons';
  import type { CopyPageLabels } from './copy-page-utils';

  interface Props {
    markdownUrl: string;
    chatgptUrl: string;
    claudeUrl: string;
    labels: CopyPageLabels;
    onCopied?: () => void;
    onCopyError?: () => void;
    class?: string;
  }

  let { markdownUrl, chatgptUrl, claudeUrl, labels, onCopied, onCopyError, class: className }: Props = $props();

  const clipboard = new UseClipboard({ delay: 2000 });
  let copying = $state(false);

  const copyLabel = $derived(clipboard.copied ? labels.copied : labels.copy);

  function openUrl(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleCopy() {
    if (copying) return;

    copying = true;

    try {
      const response = await fetch(markdownUrl);

      if (!response.ok) {
        onCopyError?.();
        return;
      }

      const markdown = await response.text();
      const status = await clipboard.copy(markdown);

      if (status === 'success') {
        onCopied?.();
        return;
      }

      onCopyError?.();
    } catch {
      onCopyError?.();
    } finally {
      copying = false;
    }
  }
</script>

<ButtonGroup.Root class={cn('ui:shrink-0', className)}>
  <Button
    type="button"
    variant="outline"
    size="sm"
    loading={copying}
    aria-busy={copying}
    aria-label={copyLabel}
    onclick={handleCopy}
  >
    {#if clipboard.copied}
      <CheckIcon class="ui:size-3.5" aria-hidden="true" />
    {:else}
      <CopyIcon class="ui:size-3.5" aria-hidden="true" />
    {/if}
    <span class="ui:hidden ui:sm:inline">{copyLabel}</span>
  </Button>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          type="button"
          variant="outline"
          size="sm"
          class={cn('ui:px-2', props.class)}
          aria-label={labels.moreActions}
        >
          <ChevronDownIcon class="ui:size-3.5" aria-hidden="true" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="ui:w-56">
      <DropdownMenu.Item onclick={() => openUrl(markdownUrl)}>
        <FileTextIcon class="ui:size-4" aria-hidden="true" />
        {labels.viewAsMarkdown}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => openUrl(chatgptUrl)}>
        <svg viewBox="0 0 24 24" class="ui:size-4" fill="currentColor" aria-hidden="true">
          <path d={CHATGPT_ICON_PATH} />
        </svg>
        {labels.openInChatGPT}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => openUrl(claudeUrl)}>
        <svg viewBox="0 0 24 24" class="ui:size-4" fill="currentColor" aria-hidden="true">
          <path d={siClaude.path} />
        </svg>
        {labels.openInClaude}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</ButtonGroup.Root>
