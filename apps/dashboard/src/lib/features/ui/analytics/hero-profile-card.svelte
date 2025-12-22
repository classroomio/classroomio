<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import type { UserAnalytics } from '$lib/utils/types/analytics';
  import AlarmClockIcon from '@lucide/svelte/icons/alarm-clock';
  import MailIcon from '@lucide/svelte/icons/mail';

  interface Props {
    user: UserAnalytics['user'];
  }

  let { user }: Props = $props();
</script>

<div class="rounded-md border p-5 dark:border-neutral-600">
  <div class="flex w-full flex-col items-center justify-start gap-4 text-start md:flex-row">
    <Avatar.Root class="h-16 w-16">
      <Avatar.Image
        src={user.avatarUrl ? user.avatarUrl : '/logo-192.png'}
        alt={user.fullName ? user.fullName : 'User'}
      />
      <Avatar.Fallback>{user.fullName ? user.fullName : 'User'}</Avatar.Fallback>
    </Avatar.Root>
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

