<script lang="ts">
  import { flip } from 'svelte/animate';
  import { settings } from '../utils/settings-store';
  import { dndzone } from 'svelte-dnd-action';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onchange: () => void;
  }

  let { onchange }: Props = $props();

  const flipDurationMs = 300;

  function handleDndConsider(e) {
    $settings.tabs = e.detail.items;
  }

  function handleDndFinalize(e) {
    $settings.tabs = e.detail.items;

    onchange();
  }
</script>

<section
  use:dndzone={{
    items: $settings.tabs,
    flipDurationMs,
    dropTargetStyle: {
      'border-style': 'dashed'
    }
  }}
  onconsider={handleDndConsider}
  onfinalize={handleDndFinalize}
  class="ui:bg-muted ui:text-muted-foreground inline-flex h-12 w-fit items-center justify-start gap-2 rounded-lg px-2 py-1"
>
  {#each $settings.tabs as item (item.id)}
    <div
      animate:flip={{ duration: flipDurationMs }}
      class="ui:bg-background ui:dark:text-foreground ui:border-input flex h-[calc(100%-3px)] items-center justify-start gap-2 rounded-md px-3 py-1 text-sm font-medium transition-[color,box-shadow]"
    >
      <GripVerticalIcon size={16} class="custom text-primary" />
      {$t(item.name)}
    </div>
  {/each}
</section>
