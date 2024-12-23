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
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
  class="w-fit flex gap-1 md:gap-3 p-1"
>
  {#each $settings.tabs as item (item.id)}
    <div
      animate:flip={{ duration: flipDurationMs }}
      class="flex items-center justify-start text-center text-xs md:text-base gap-1 md:gap-2 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded-md"
    >
      <Draggable size={16} />
      {$t(item.name)}
    </div>
  {/each}
</section>
