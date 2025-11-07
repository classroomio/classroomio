<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import BellPlusIcon from '@lucide/svelte/icons/bell-plus';
  import BadgeHelpIcon from '@lucide/svelte/icons/badge-help';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
</script>

<DropdownMenu.Item class="m-0">
  <div class="space-y-4">
    <a href="https://classroomio.com/roadmap" target="_blank" class="flex items-center gap-2 hover:no-underline">
      <BellPlusIcon size={16} />
      <p class="text-sm">{$t('profileMenu.whats_new')}</p>
    </a>

    <a
      href="https://classroomio.com/blog/launch-week"
      target="_blank"
      class="flex items-center gap-2 hover:no-underline"
    >
      <RocketIcon size={16} />
      <p class="text-sm">{$t('profileMenu.launch_week')}</p>
    </a>

    <a href={$currentOrgPath} class="flex h-full w-full items-center justify-start space-x-2 text-start">
      <BadgeHelpIcon size={20} />
      <p class="text-sm dark:text-white">{$t('org_navigation.help')}</p>
    </a>
  </div>
</DropdownMenu.Item>
