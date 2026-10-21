<script lang="ts">
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import type { UserAnalytics } from '$lib/utils/types/analytics';
  import { profile } from '$lib/utils/store/user';
  import { reportDialog } from '$features/report';
  import { Button } from '@cio/ui/base/button';
  import AlarmClockIcon from '@lucide/svelte/icons/alarm-clock';
  import MailIcon from '@lucide/svelte/icons/mail';
  import FlagIcon from '@lucide/svelte/icons/flag';

  interface Props {
    user: UserAnalytics['user'];
  }

  let { user }: Props = $props();

  const canReport = $derived(Boolean(user.id && user.id !== $profile.id));
</script>

<div class="relative rounded-md border p-5">
  {#if canReport}
    <Button
      variant="outline"
      size="sm"
      onclick={() => reportDialog.start('profile', user.id)}
      class="mb-3 md:absolute md:top-5 md:right-5 md:mb-0"
    >
      <FlagIcon class="mr-2 size-3.5" />
      {$t('report.menu')}
    </Button>
  {/if}
  <div class="flex w-full flex-col items-center justify-start gap-4 text-start md:flex-row">
    <UserAvatar src={user.avatarUrl} alt={user.fullName ?? 'User'} class="h-16 w-16" />
    <div class="flex flex-col space-y-2">
      <p class="text-center text-2xl md:text-left dark:text-white">
        {user.fullName}
      </p>

      <div class="flex flex-col items-center gap-1 md:flex-row md:gap-4">
        <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
          <MailIcon size={16} />
          {user.email}
        </p>

        <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
          <AlarmClockIcon size={16} />
          {$t('analytics.last_seen')}:
          <span class="italic">
            {user.lastSeen ? calDateDiff(user.lastSeen) : $t('analytics.a_while_ago')}
          </span>
        </p>
      </div>
    </div>
  </div>
</div>
