<script lang="ts">
  import { browser } from '$app/environment';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { ChecklistItem } from '@cio/ui/custom/checklist-item';

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

  $effect(() => {
    if (!browser) return;

    inviteOpened = hasOpenedZapierInvite($profile.id);
  });

  function rememberInvite() {
    rememberZapierInviteOpened($profile.id);
    inviteOpened = true;
    onInviteOpened?.();
  }
</script>

{#snippet stepNumber(step: number)}
  <span class="text-xs font-semibold" aria-hidden="true">{step}</span>
{/snippet}

<Dialog.Root bind:open onOpenChange={(isOpen) => (open = isOpen)}>
  <Dialog.Content class="sm:max-w-lg" data-testid="zapier-invite-dialog">
    <Dialog.Header>
      <Dialog.Title>{$t(`${T}.title`)}</Dialog.Title>
      <Dialog.Description>{$t(`${T}.description`)}</Dialog.Description>
    </Dialog.Header>

    <ol class="flex flex-col gap-3">
      <li>
        <ChecklistItem
          title={$t(`${T}.step_1_title`)}
          description={$t(`${T}.step_1_description`)}
          completed={inviteOpened}
          doneLabel={$t(`${T}.step_done`)}
          testId="zapier-invite-step-1"
        >
          {#snippet media()}
            {@render stepNumber(1)}
          {/snippet}
          {#snippet action()}
            <Button
              variant="secondary"
              size="sm"
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onclick={rememberInvite}
              testId="zapier-invite-open"
            >
              {$t(`${T}.step_1_button`)}
              <ArrowUpRightIcon size={14} />
            </Button>
          {/snippet}
        </ChecklistItem>
      </li>

      <li>
        <ChecklistItem
          title={$t(`${T}.step_2_title`)}
          description={$t(`${T}.step_2_description`)}
          doneLabel={$t(`${T}.step_done`)}
          testId="zapier-invite-step-2"
        >
          {#snippet media()}
            {@render stepNumber(2)}
          {/snippet}
          {#snippet action()}
            <Button
              size="sm"
              href={inviteOpened ? targetUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!inviteOpened}
              onclick={() => (open = false)}
              testId="zapier-invite-continue"
            >
              {$t(`${T}.step_2_button`)}
              <ArrowUpRightIcon size={14} />
            </Button>
          {/snippet}
        </ChecklistItem>
      </li>
    </ol>

    <Dialog.Footer class="justify-between">
      <Button
        variant="link"
        size="sm"
        class="px-0"
        disabled={inviteOpened}
        onclick={rememberInvite}
        testId="zapier-invite-already"
      >
        {$t(`${T}.already_accepted`)}
      </Button>
      <Button variant="outline" size="sm" onclick={() => (open = false)}>
        {$t('common.cancel')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
