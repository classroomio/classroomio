<script lang="ts">
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Button } from '../../base/button';

  interface Props {
    collapsed?: boolean;
    /** id of the children container, for aria-controls */
    controls: string;
    collapseLabel: string;
    expandLabel: string;
    onclick: () => void;
    class?: string;
  }

  let { collapsed = false, controls, collapseLabel, expandLabel, onclick, class: className = '' }: Props = $props();
</script>

<Button
  variant="secondary"
  size="xs"
  {onclick}
  aria-expanded={!collapsed}
  aria-controls={controls}
  class="ui:size-5 ui:shrink-0 ui:rounded-sm ui:p-0 {className}"
>
  {#if collapsed}
    <PlusIcon class="ui:size-3" aria-hidden="true" />
  {:else}
    <MinusIcon class="ui:size-3" aria-hidden="true" />
  {/if}
  <span class="ui:sr-only">{collapsed ? expandLabel : collapseLabel}</span>
</Button>
