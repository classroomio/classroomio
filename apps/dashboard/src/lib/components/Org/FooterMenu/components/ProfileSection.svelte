<script lang="ts">
  import * as Command from '@cio/ui/base/command';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  import { profile } from '$lib/utils/store/user';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
</script>

<Command.Group>
  <a
    href={`${!$globalStore.isOrgSite ? $currentOrgPath : '/lms'}/settings`}
    class="flex w-full items-center justify-between hover:no-underline"
  >
    <span class="flex max-w-[70%] items-center gap-2">
      <img src={$profile.avatar_url} alt="profile" class="h-8 w-8 rounded-full" />
      <div>
        <p class="w-[80%] truncate text-sm">{$profile.fullname}</p>
        <p class="w-[80%] truncate text-xs">{$profile.email}</p>
      </div>
    </span>
    <div>
      <SettingsIcon size={16} />
    </div>
  </a>
</Command.Group>
