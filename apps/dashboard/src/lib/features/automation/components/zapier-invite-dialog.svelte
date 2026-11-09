<script lang="ts">
  import { browser } from '$app/environment';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';

  import {
    getZapierInviteUrl,
    hasOpenedZapierInvite,
    rememberZapierInviteOpened
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    open: boolean;
    targetUrl: string;
    onInviteOpened?: () => void;
  }

  let { open = $bindable(false), targetUrl, onInviteOpened }: Props = $props();

  const T = 'automation.zapier.invite';
  const inviteUrl = getZapierInviteUrl();

  let inviteOpened = $state(browser ? hasOpenedZapierInvite($profile.id) : false);

  const canContinue = $derived(inviteOpened || !inviteUrl);

  $effect(() => {
    if (!browser) return;

    inviteOpened = hasOpenedZapierInvite($profile.id);
  });

  function rememberInvite() {
    rememberZapierInviteOpened($profile.id);
    inviteOpened = true;
    onInviteOpened?.();
  }

  function handleInviteClick() {
    rememberInvite();
  }

  function handleAlreadyAccepted() {
    rememberInvite();
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => (open = isOpen)}>
  <Dialog.Content class="sm:max-w-lg" data-testid="zapier-invite-dialog">
    <Dialog.Header>
      <Dialog.Title>{$t(`${T}.title`)}</Dialog.Title>
      <Dialog.Description>{$t(`${T}.description`)}</Dialog.Description>
    </Dialog.Header>

    <ol class="flex flex-col gap-3">
      <li class="ui:border-border flex gap-3 rounded-lg border p-3">
        <span
          class="ui:bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          aria-hidden="true"
        >
          1
        </span>

        <div class="min-w-0 flex-1 space-y-2">
          <p class="text-sm font-semibold">{$t(`${T}.step_1_title`)}</p>
          <p class="ui:text-muted-foreground text-xs leading-relaxed">{$t(`${T}.step_1_description`)}</p>

          <Button
            variant="secondary"
            size="sm"
            href={inviteUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!inviteUrl}
            onclick={handleInviteClick}
            testId="zapier-invite-open"
          >
            {$t(`${T}.step_1_button`)}
            <ArrowUpRightIcon size={14} />
          </Button>

          {#if !inviteUrl}
            <p class="ui:text-muted-foreground text-xs">{$t(`${T}.missing_invite`)}</p>
          {/if}
        </div>
      </li>

      <li class="ui:border-border flex gap-3 rounded-lg border p-3">
        <span
          class="ui:bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          aria-hidden="true"
        >
          2
        </span>

        <div class="min-w-0 flex-1 space-y-2">
          <p class="text-sm font-semibold">{$t(`${T}.step_2_title`)}</p>
          <p class="ui:text-muted-foreground text-xs leading-relaxed">{$t(`${T}.step_2_description`)}</p>

          <Button
            size="sm"
            href={canContinue ? targetUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!canContinue}
            onclick={() => (open = false)}
            testId="zapier-invite-continue"
          >
            {$t(`${T}.step_2_button`)}
            <ArrowUpRightIcon size={14} />
          </Button>
        </div>
      </li>
    </ol>

    <Dialog.Footer class="justify-between">
      <Button variant="link" size="sm" class="px-0" onclick={handleAlreadyAccepted} testId="zapier-invite-already">
        {$t(`${T}.already_accepted`)}
      </Button>
      <Button variant="outline" size="sm" onclick={() => (open = false)}>
        {$t('common.cancel')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
