<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
  import Share2Icon from '@lucide/svelte/icons/share-2';
  import SquareArrowOutUpRightIcon from '@lucide/svelte/icons/square-arrow-out-up-right';
  import { siClaude, siFacebook, siInstagram, siX } from 'simple-icons';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { UseClipboard } from '../../hooks/use-clipboard.svelte';
  import { cn } from '../../tools';
  import { CHATGPT_ICON_PATH, LINKEDIN_ICON_PATH } from './copy-page-icons';
  import { fetchLessonMarkdown } from './copy-page-utils';
  import {
    buildFacebookShareUrl,
    buildLinkedInShareUrl,
    buildXShareUrl,
    openShareWindow,
    type OutlineRailActionLabels
  } from './share-utils';

  interface Props {
    pageUrl: string;
    pageTitle: string;
    labels: OutlineRailActionLabels;
    markdownUrl?: string | null;
    chatgptUrl?: string | null;
    claudeUrl?: string | null;
    onCopied?: () => void;
    onCopyError?: () => void;
    onInstagramCopied?: () => void;
    class?: string;
  }

  let {
    pageUrl,
    pageTitle,
    labels,
    markdownUrl = null,
    chatgptUrl = null,
    claudeUrl = null,
    onCopied,
    onCopyError,
    onInstagramCopied,
    class: className
  }: Props = $props();

  const markdownClipboard = new UseClipboard({ delay: 2000 });
  const instagramClipboard = new UseClipboard({ delay: 2000 });
  let copyingMarkdown = $state(false);

  const hasCopy = $derived(Boolean(markdownUrl));
  const hasChat = $derived(Boolean(chatgptUrl || claudeUrl));
  const hasShare = $derived(Boolean(pageUrl));
  const hasActions = $derived(hasCopy || hasChat || hasShare);
  const copyLabel = $derived(markdownClipboard.copied ? labels.copied : labels.copyAsMarkdown);

  const facebookShareUrl = $derived(buildFacebookShareUrl(pageUrl));
  const linkedInShareUrl = $derived(buildLinkedInShareUrl(pageUrl));
  const xShareUrl = $derived(buildXShareUrl(pageUrl, pageTitle));

  const rowClass =
    'ui:flex ui:w-full ui:items-center ui:gap-2 ui:rounded-md ui:px-1 ui:py-1.5 ui:text-left ui:text-sm ui:text-muted-foreground ui:transition-colors ui:hover:bg-muted/60 ui:hover:text-foreground ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring';

  function openUrl(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleCopyMarkdown() {
    if (copyingMarkdown || !markdownUrl) return;

    copyingMarkdown = true;

    const markdown = await fetchLessonMarkdown(markdownUrl);

    if (!markdown) {
      copyingMarkdown = false;
      onCopyError?.();
      return;
    }

    const status = await markdownClipboard.copy(markdown);
    copyingMarkdown = false;

    if (status === 'success') {
      onCopied?.();
      return;
    }

    onCopyError?.();
  }

  async function handleInstagramShare() {
    const status = await instagramClipboard.copy(pageUrl);

    if (status === 'success') {
      onInstagramCopied?.();
    }
  }
</script>

{#if hasActions}
  <div class={cn('ui:flex ui:flex-col ui:gap-0.5', className)}>
    {#if hasCopy}
      <button type="button" class={rowClass} aria-busy={copyingMarkdown} onclick={handleCopyMarkdown}>
        {#if markdownClipboard.copied}
          <CheckIcon class="ui:size-3.5 ui:shrink-0" aria-hidden="true" />
        {:else}
          <CopyIcon class="ui:size-3.5 ui:shrink-0" aria-hidden="true" />
        {/if}
        <span class="ui:min-w-0 ui:flex-1">{copyLabel}</span>
      </button>
    {/if}

    {#if hasShare}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class={cn(rowClass, 'ui:[&[data-state=open]_svg:last-child]:rotate-180', props.class)}
            >
              <Share2Icon class="ui:size-3.5 ui:shrink-0" aria-hidden="true" />
              <span class="ui:min-w-0 ui:flex-1">{labels.share}</span>
              <ChevronDownIcon class="ui:ml-auto ui:size-3.5 ui:shrink-0 ui:transition-transform" aria-hidden="true" />
            </button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom" class="ui:w-52">
          <DropdownMenu.Item onclick={() => openShareWindow(facebookShareUrl)}>
            <svg viewBox="0 0 24 24" class="ui:size-3.5" fill="currentColor" aria-hidden="true">
              <path d={siFacebook.path} />
            </svg>
            {labels.facebook}
            <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => openShareWindow(linkedInShareUrl)}>
            <svg viewBox="0 0 24 24" class="ui:size-3.5" fill="currentColor" aria-hidden="true">
              <path d={LINKEDIN_ICON_PATH} />
            </svg>
            {labels.linkedin}
            <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => openShareWindow(xShareUrl)}>
            <svg viewBox="0 0 24 24" class="ui:size-3.5" fill="currentColor" aria-hidden="true">
              <path d={siX.path} />
            </svg>
            {labels.x}
            <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={handleInstagramShare}>
            <svg viewBox="0 0 24 24" class="ui:size-3.5" fill="currentColor" aria-hidden="true">
              <path d={siInstagram.path} />
            </svg>
            {labels.instagram}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}

    {#if hasChat}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class={cn(rowClass, 'ui:[&[data-state=open]_svg:last-child]:rotate-180', props.class)}
            >
              <MessageCircleIcon class="ui:size-3.5 ui:shrink-0" aria-hidden="true" />
              <span class="ui:min-w-0 ui:flex-1">{labels.openInChat}</span>
              <ChevronDownIcon class="ui:ml-auto ui:size-3.5 ui:shrink-0 ui:transition-transform" aria-hidden="true" />
            </button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom" class="ui:w-52">
          {#if chatgptUrl}
            {@const chatGptHref = chatgptUrl}
            <DropdownMenu.Item onclick={() => openUrl(chatGptHref)}>
              <svg viewBox="0 0 24 24" class="ui:size-3.5" fill="currentColor" aria-hidden="true">
                <path d={CHATGPT_ICON_PATH} />
              </svg>
              {labels.openInChatGPT}
              <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
            </DropdownMenu.Item>
          {/if}
          {#if claudeUrl}
            {@const claudeHref = claudeUrl}
            <DropdownMenu.Item onclick={() => openUrl(claudeHref)}>
              <svg viewBox="0 0 24 24" class="ui:size-3.5" fill="currentColor" aria-hidden="true">
                <path d={siClaude.path} />
              </svg>
              {labels.openInClaude}
              <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
{/if}
