<script lang="ts">
  import { browser } from '$app/environment';
  import { Button, type ButtonSize, type ButtonVariant } from '@cio/ui/base/button';
  import type { Snippet } from 'svelte';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierInviteDialog from '$features/automation/components/zapier-invite-dialog.svelte';
  import {
    hasAcceptedZapierInvite,
    hasOpenedZapierInvite,
    isZapierInviteRequired
  } from '$features/automation/utils/zapier-utils';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    /** Zapier destination. Opened directly, or after the invite dialog while the integration is invite-only. */
    href: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    testId?: string;
    disabled?: boolean;
    children?: Snippet;
  }

  let { href, variant, size, class: className, testId, disabled, children }: Props = $props();

  let isDialogOpen = $state(false);
  let inviteOpened = $state(browser ? hasOpenedZapierInvite($profile.id) : false);
  let overviewRequestedForOrg = '';

  const accepted = $derived(
    hasAcceptedZapierInvite(zapierApi.overview?.connections ?? [], $profile.id) || inviteOpened
  );
  const requiresInvite = $derived(isZapierInviteRequired() && !accepted);

  $effect(() => {
    if (!browser) return;

    inviteOpened = hasOpenedZapierInvite($profile.id);
  });

  $effect(() => {
    const organizationId = $currentOrg.id;

    if (!browser || !isZapierInviteRequired() || !organizationId) return;
    if ($isOrgAdmin !== true || zapierApi.overview) return;
    if (overviewRequestedForOrg === organizationId) return;

    overviewRequestedForOrg = organizationId;
    void zapierApi.loadOnce();
  });

  function handleClick(event: MouseEvent) {
    if (!requiresInvite) return;

    event.preventDefault();
    isDialogOpen = true;
  }
</script>

<Button
  {variant}
  {size}
  class={className}
  {testId}
  {disabled}
  {href}
  target="_blank"
  rel="noopener noreferrer"
  onclick={handleClick}
>
  {@render children?.()}
</Button>

<ZapierInviteDialog bind:open={isDialogOpen} targetUrl={href} onInviteOpened={() => (inviteOpened = true)} />
