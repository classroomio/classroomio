<script>
  import { flip } from 'svelte/animate';
  import { settings } from './store';
  import { dndzone } from 'svelte-dnd-action';
  import Draggable from 'carbon-icons-svelte/lib/Draggable.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const flipDurationMs = 300;

  function handleDndConsider(e) {
    $settings.tabs = e.detail.items;
  }

  function handleDndFinalize(e) {
    $settings.tabs = e.detail.items;

    dispatch('change');
  }
</script>

<section
  use:dndzone={{
    items: $settings.tabs,
    flipDurationMs,
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    }
  }}
  onconsider={handleDndConsider}
  onfinalize={handleDndFinalize}
  class="flex w-fit gap-1 p-1 md:gap-3"
>
  {#each $settings.tabs as item (item.id)}
    <div
      animate:flip={{ duration: flipDurationMs }}
      class="flex items-center justify-start gap-1 rounded-md bg-slate-100 p-2 text-center text-xs md:gap-2 md:text-base dark:bg-slate-700 dark:text-white"
    >
      <Draggable size={16} />
      {$t(item.name)}
    </div>
  {/each}
</section>
