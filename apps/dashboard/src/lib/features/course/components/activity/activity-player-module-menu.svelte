<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { t } from '$lib/utils/functions/translations';
  import type { LaunchActivityModule } from '$features/course/utils/types';

  interface Props {
    units: LaunchActivityModule[];
    currentIdentifier: string | null;
    onSelect: (identifier: string) => void;
  }

  let { units, currentIdentifier, onSelect }: Props = $props();

  const completedCount = $derived(units.filter((unit) => unit.completed).length);
</script>

<div>
  <p class="ui:text-muted-foreground text-sm">
    {$t('course.navItem.lessons.activities.player.modules_complete', {
      complete: completedCount,
      total: units.length
    })}
  </p>
  <div
    class="mt-2 flex gap-2 overflow-x-auto pb-2"
    role="listbox"
    aria-label={$t('course.navItem.lessons.activities.player.module_menu')}
  >
    {#each units as unit (unit.identifier)}
      <Button
        size="sm"
        variant={unit.identifier === currentIdentifier ? 'default' : 'outline'}
        onclick={() => onSelect(unit.identifier)}
        aria-current={unit.identifier === currentIdentifier}
      >
        {#if unit.completed}
          <CircleCheckIcon size={14} filled />
        {/if}
        <span class="max-w-44 truncate">{unit.title}</span>
      </Button>
    {/each}
  </div>
</div>
