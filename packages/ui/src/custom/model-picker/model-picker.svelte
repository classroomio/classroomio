<script lang="ts">
  import * as Popover from '../../base/popover';
  import * as Select from '../../base/select';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CheckIcon from '@lucide/svelte/icons/check';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { AGENT_MODELS, UI_PICKER_MODEL_IDS, type AgentModelId } from '@cio/utils/agent-models';

  interface Props {
    value: AgentModelId;
    disabled?: boolean;
    variant?: 'compact' | 'select';
    lockedModelIds?: readonly AgentModelId[];
    onChange: (id: AgentModelId) => void;
    onLockedSelect?: (id: AgentModelId) => void;
  }

  let { value, disabled = false, variant = 'compact', lockedModelIds = [], onChange, onLockedSelect }: Props = $props();

  let open = $state(false);

  function isLocked(id: AgentModelId) {
    return lockedModelIds.includes(id);
  }

  function handleSelect(id: AgentModelId) {
    if (isLocked(id)) {
      onLockedSelect?.(id);
      open = false;
      return;
    }

    onChange(id);
    open = false;
  }
</script>

{#if variant === 'select'}
  <Select.Root type="single" {value} onValueChange={(v) => v && handleSelect(v as AgentModelId)} {disabled}>
    <Select.Trigger>
      <span class="ui:flex ui:items-center ui:gap-1">
        {AGENT_MODELS[value].label}
        {#if AGENT_MODELS[value].costTier === 'high'}
          <span class="ui:text-red-500 ui:font-medium">$$$</span>
        {:else}
          <span class="ui:text-green-500 ui:font-medium">$</span>
        {/if}
      </span>
    </Select.Trigger>
    <Select.Content>
      {#each UI_PICKER_MODEL_IDS as id (id)}
        <Select.Item value={id} label={AGENT_MODELS[id].label}>
          <span class="ui:flex ui:w-full ui:items-center ui:justify-between ui:gap-2">
            <span class="ui:flex ui:min-w-0 ui:items-center ui:gap-2">
              <span>{AGENT_MODELS[id].label}</span>
              {#if isLocked(id)}
                <RocketIcon size={16} class="ui:text-primary! ui:shrink-0" />
              {/if}
            </span>
            <span
              class={AGENT_MODELS[id].costTier === 'high'
                ? 'ui:text-red-500 ui:font-medium'
                : 'ui:text-green-500 ui:font-medium'}
            >
              {AGENT_MODELS[id].costTier === 'high' ? '$$$' : '$'}
            </span>
          </span>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
{:else}
  <Popover.Root bind:open>
    <Popover.Trigger
      {disabled}
      class="ui:text-muted-foreground hover:ui:bg-muted ui:hover:text-foreground flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-40"
    >
      <span class="truncate">{AGENT_MODELS[value].label}</span>
      {#if AGENT_MODELS[value].costTier === 'high'}
        <span class="ui:text-red-500 font-medium">$$$</span>
      {:else}
        <span class="ui:text-green-500 font-medium">$</span>
      {/if}
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
            <span class="flex min-w-0 items-center gap-2">
              <span class="min-w-0 truncate">{AGENT_MODELS[id].label}</span>
              {#if isLocked(id)}
                <RocketIcon size={16} class="ui:text-primary! ui:shrink-0" />
              {/if}
            </span>
            <span class="flex shrink-0 items-center gap-1">
              {#if AGENT_MODELS[id].costTier === 'high'}
                <span class="ui:text-red-500 font-medium">$$$</span>
              {:else}
                <span class="ui:text-green-500 font-medium">$</span>
              {/if}
              {#if isSelected}
                <CheckIcon size={14} class="ui:text-primary" />
              {/if}
            </span>
          </button>
        {/each}
      </div>
    </Popover.Content>
  </Popover.Root>
{/if}
