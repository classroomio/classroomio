<script lang="ts">
  import * as Command from '@cio/ui/base/command';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import { t } from '$lib/utils/functions/translations';

  import FreeTool from './FreeTool.svelte';

  let freeTools: { link: string; icon: string; label: string }[] = $state([]);

  $effect(() => {
    freeTools = [
      {
        link: 'https://classroomio.com/tools/progress',
        icon: '/progress.svg',
        label: $t('profileMenu.progress')
      },
      {
        link: 'https://classroomio.com/tools/activity-stopwatch',
        icon: '/timer.svg',
        label: $t('profileMenu.timer')
      },
      {
        link: 'https://classroomio.com/tools/tic-tac-toe',
        icon: '/tictac.svg',
        label: $t('profileMenu.tic_tac')
      }
    ];
  });
</script>

<div class="space-y-4 border-b py-3">
  <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.free_tools')}</p>

  {#each freeTools as tool}
    <FreeTool link={tool.link} icon={tool.icon} label={tool.label} />
  {/each}

  <Command.Group class="m-0">
    <a href="https://classroomio.com/tools" target="_blank" class="ml-auto flex w-fit items-center justify-end">
      <div class="flex items-center justify-end gap-1 text-xs font-semibold text-blue-900">
        {$t('profileMenu.see_more')}
        <ChevronDownIcon size={16} class="text-blue-900" />
      </div>
    </a>
  </Command.Group>
</div>
