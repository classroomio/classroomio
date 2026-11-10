<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Alert from '@cio/ui/base/alert';

  import { getZapierInviteUrl, rememberZapierInviteOpened } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    onDismiss: () => void;
  }

  let { onDismiss }: Props = $props();

  const T = 'automation.zapier.invite';
  const inviteUrl = getZapierInviteUrl();
</script>

<Alert.Root variant="information" {onDismiss} dismissLabel={$t('common.dismiss')} data-testid="zapier-invite-note">
  <InfoIcon />
  <Alert.Description>
    <p>
      {$t(`${T}.note`)}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- inviteUrl is an absolute Zapier URL from env, not an internal route. -->
      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
        onclick={() => rememberZapierInviteOpened($profile.id)}
        data-testid="zapier-invite-note-open"
      >
        {$t(`${T}.step_1_button`)}
        <ArrowUpRightIcon size={14} />
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </p>
  </Alert.Description>
</Alert.Root>
