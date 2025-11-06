<script lang="ts">
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import * as Command from '@cio/ui/base/command';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgDomain, currentOrgPath } from '$lib/utils/store/org';

  import Avatar from '$lib/components/Avatar/index.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
</script>

<Command.Group heading={$t('profileMenu.current_org')} class="">
  <a href={`${$currentOrgPath}/settings?tab=org`} class="flex items-center justify-between hover:no-underline">
    <span class="flex max-w-[70%] items-center gap-2">
      {#if $currentOrg.avatar_url && $currentOrg.name}
        <Avatar src={$currentOrg.avatar_url} name={$currentOrg.name} shape="rounded-md" width="w-7" height="h-7" />
      {:else if $currentOrg.shortName}
        <TextChip size="sm" value={$currentOrg.shortName} className="bg-primary-200 dark:text-black" />
      {/if}
      <div>
        <p class="w-[80%] truncate text-sm">{$currentOrg.name}</p>
        <p class="w-[80%] truncate text-xs">
          {$currentOrgDomain}
        </p>
      </div>
    </span>
    <div>
      <SettingsIcon size={16} />
    </div>
  </a>
</Command.Group>
