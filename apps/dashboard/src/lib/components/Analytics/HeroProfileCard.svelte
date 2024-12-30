<script lang="ts">
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import type { UserAnalytics } from '$lib/utils/types/analytics';
  import Alarm from 'carbon-icons-svelte/lib/Alarm.svelte';
  import Email from 'carbon-icons-svelte/lib/Email.svelte';

  export let user: UserAnalytics['user'];
</script>

<div class="rounded-md border p-5 dark:border-neutral-600">
  <div class="flex w-full flex-col items-center justify-start gap-4 text-start md:flex-row">
    <Avatar src={user.avatarUrl} name={user.fullName} width="w-16" height="h-16" />
    <div class="flex flex-col space-y-2">
      <p class="text-center text-2xl font-bold dark:text-white md:text-left">
        {user.fullName}
      </p>

      <div class="flex flex-col items-center gap-1 md:flex-row md:gap-4">
        <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
          <Email />
          {user.email}
        </p>

        <p class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-300">
          <Alarm />
          {$t('analytics.last_seen')}:
          <span class="italic">
            {user.lastSeen ? calDateDiff(user.lastSeen) : $t('analytics.a_while_ago')}
          </span>
        </p>
      </div>
    </div>
  </div>
</div>
