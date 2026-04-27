<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { AGENT_MODELS, UI_PICKER_MODEL_IDS, type AgentModelId } from '@cio/utils/agent-models';

  interface Props {
    value: AgentModelId;
    disabled?: boolean;
    onChange: (id: AgentModelId) => void;
  }

  let { value, disabled = false, onChange }: Props = $props();

  let open = $state(false);

  function handleSelect(id: AgentModelId) {
    onChange(id);
    open = false;
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger
    {disabled}
    class="ui:text-muted-foreground hover:ui:bg-muted ui:hover:text-foreground flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-40"
  >
    <span class="truncate">{AGENT_MODELS[value].label}</span>
    <ChevronDownIcon size={12} />
  </Popover.Trigger>

  <Popover.Content class="ui:p-0! ui:z-[110] w-48" align="end" side="top">
    <div class="py-1">
      {#each UI_PICKER_MODEL_IDS as id (id)}
        {@const isSelected = id === value}
        <button
          type="button"
          onclick={() => handleSelect(id)}
          class="hover:ui:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors"
        >
          <span class="min-w-0 truncate">{AGENT_MODELS[id].label}</span>
          {#if isSelected}
            <CheckIcon size={14} class="ui:text-primary shrink-0" />
          {/if}
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
