<script lang="ts">
  import type { Snippet } from 'svelte';
  import SquareArrowOutUpRightIcon from '@lucide/svelte/icons/square-arrow-out-up-right';
  import { siFacebook, siInstagram, siX } from 'simple-icons';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { UseClipboard } from '../../hooks/use-clipboard.svelte';
  import BrandMark from './brand-mark.svelte';
  import { LINKEDIN_ICON_PATH } from './copy-page-icons';
  import {
    buildFacebookShareUrl,
    buildLinkedInShareUrl,
    buildXShareUrl,
    openShareWindow,
    type ShareActionLabels
  } from './share-utils';

  interface Props {
    pageUrl: string;
    pageTitle: string;
    labels: ShareActionLabels;
    onInstagramCopied?: () => void;
    trigger: Snippet<[{ props: Record<string, unknown> }]>;
    contentClass?: string;
  }

  let { pageUrl, pageTitle, labels, onInstagramCopied, trigger, contentClass = 'ui:w-52' }: Props = $props();

  const instagramClipboard = new UseClipboard({ delay: 2000 });
  const facebookShareUrl = $derived(buildFacebookShareUrl(pageUrl));
  const linkedInShareUrl = $derived(buildLinkedInShareUrl(pageUrl));
  const xShareUrl = $derived(buildXShareUrl(pageUrl, pageTitle));

  async function handleInstagramShare() {
    const status = await instagramClipboard.copy(pageUrl);

    if (status === 'success') {
      onInstagramCopied?.();
    }
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      {@render trigger({ props })}
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" side="bottom" class={contentClass}>
    <DropdownMenu.Item onclick={() => openShareWindow(facebookShareUrl)}>
      <BrandMark path={siFacebook.path} class="ui:size-3.5" />
      {labels.facebook}
      <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => openShareWindow(linkedInShareUrl)}>
      <BrandMark path={LINKEDIN_ICON_PATH} class="ui:size-3.5" />
      {labels.linkedin}
      <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => openShareWindow(xShareUrl)}>
      <BrandMark path={siX.path} class="ui:size-3.5" />
      {labels.x}
      <SquareArrowOutUpRightIcon class="ui:ml-auto ui:size-3" aria-hidden="true" />
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={handleInstagramShare}>
      <BrandMark path={siInstagram.path} class="ui:size-3.5" />
      {labels.instagram}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
