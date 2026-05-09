<script lang="ts">
  import * as Select from '../../base/select';
  import { Textarea } from '../../base/textarea';
  import { Button } from '../../base/button';
  import ModelPicker from '../model-picker/model-picker.svelte';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { DEFAULT_PICKER_MODEL_ID, type AgentModelId } from '@cio/utils/agent-models';

  interface SelectOption {
    value: string;
    label: string;
  }

  interface SubmitPayload {
    prompt: string;
    level: string;
    model?: string;
  }

  interface Props {
    heading: string;
    placeholder: string;
    loading?: boolean;
    levelOptions?: SelectOption[];
    model?: AgentModelId;
    lockedModelIds?: readonly AgentModelId[];
    onModelChange?: (model: AgentModelId) => void;
    onLockedModelSelect?: (model: AgentModelId) => void;
    onsubmit?: (payload: SubmitPayload) => void;
  }

  let {
    heading,
    placeholder,
    loading = false,
    levelOptions = [],
    model = DEFAULT_PICKER_MODEL_ID,
    lockedModelIds = [],
    onModelChange,
    onLockedModelSelect,
    onsubmit
  }: Props = $props();

  let prompt = $state('');
  let level = $state('beginner');
  let selectedModel = $state<AgentModelId>(model);

  const selectedLevelLabel = $derived(
    levelOptions.find((o) => o.value === level)?.label ?? levelOptions[0]?.label ?? ''
  );
  const canSubmit = $derived(!!prompt.trim() && !loading);

  $effect(() => {
    if (model !== selectedModel) {
      selectedModel = model;
    }
  });

  function handleModelChange(id: AgentModelId) {
    selectedModel = id;
    onModelChange?.(id);
  }

  function handleSubmit() {
    if (!canSubmit) return;

    onsubmit?.({ prompt, level, model: selectedModel });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="ui:flex ui:w-full ui:flex-col ui:items-center ui:gap-8">
  <h1 class="ui:text-center ui:text-3xl ui:font-semibold ui:tracking-tight">{heading}</h1>

  <div class="ui:bg-card ui:w-full ui:max-w-3xl ui:rounded-2xl ui:border ui:p-4">
    <Textarea
      bind:value={prompt}
      {placeholder}
      rows={4}
      disabled={loading}
      onkeydown={handleKeydown}
      class="ui:w-full ui:resize-none ui:border-0! ui:focus-visible:ring-0! ui:focus-visible:ring-offset-0!"
    />

    <div class="ui:mt-3 ui:flex ui:items-center ui:gap-2">
      <Select.Root type="single" bind:value={level} disabled={loading}>
        <Select.Trigger>
          {selectedLevelLabel}
        </Select.Trigger>
        <Select.Content>
          {#each levelOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label}>
              {option.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <ModelPicker
        value={selectedModel}
        disabled={loading}
        variant="select"
        {lockedModelIds}
        onChange={handleModelChange}
        onLockedSelect={onLockedModelSelect}
      />

      <div class="ui:ml-auto">
        <Button variant="secondary" size="icon" disabled={!canSubmit} onclick={handleSubmit}>
          {#if loading}
            <LoaderCircleIcon class="ui:h-4 ui:w-4 ui:animate-spin" />
          {:else}
            <ArrowUpIcon class="ui:h-4 ui:w-4" />
          {/if}
        </Button>
      </div>
    </div>
  </div>
</div>
