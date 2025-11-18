<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import BellPlusIcon from '@lucide/svelte/icons/bell-plus';
  import BadgeHelpIcon from '@lucide/svelte/icons/badge-help';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
</script>

<div class="space-y-4">
  <DropdownMenu.Item class="m-0">
    <a href="https://classroomio.com/roadmap" target="_blank" class="flex w-full items-center gap-2">
      <BellPlusIcon size={16} />
      <p class="text-sm">{$t('profileMenu.whats_new')}</p>
    </a>
  </DropdownMenu.Item>

  <DropdownMenu.Item class="m-0">
    <a href="https://classroomio.com/blog/launch-week" target="_blank" class="flex w-full items-center gap-2">
      <RocketIcon size={16} />
      <p class="text-sm">{$t('profileMenu.launch_week')}</p>
    </a>
  </DropdownMenu.Item>

  <DropdownMenu.Item class="m-0">
    <a href={$currentOrgPath} class="flex h-full w-full items-center justify-start space-x-2 text-start">
      <BadgeHelpIcon size={20} />
      <p class="text-sm dark:text-white">{$t('org_navigation.help')}</p>
    </a>
  </DropdownMenu.Item>
</div>

<style>
  a {
    text-decoration: none;
  }
</style>
