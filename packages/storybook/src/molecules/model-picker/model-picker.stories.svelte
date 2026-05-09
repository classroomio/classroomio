<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ModelPicker } from '@cio/ui/custom/model-picker';

  const { Story } = defineMeta({
    title: 'Molecules/ModelPicker',
    component: ModelPicker,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<script>
  import { DEFAULT_PICKER_MODEL_ID, type AgentModelId } from '@cio/utils/agent-models';

  let selected = $state<AgentModelId>(DEFAULT_PICKER_MODEL_ID);
</script>

<Story name="Default">
  {#snippet template()}
    <div class="p-8">
      <ModelPicker value={selected} onChange={(id) => (selected = id)} />
      <p class="mt-4 text-sm text-gray-500">Selected: {selected}</p>
    </div>
  {/snippet}
</Story>

<Story name="Select Variant">
  {#snippet template()}
    <div class="p-8">
      <ModelPicker value={selected} variant="select" onChange={(id) => (selected = id)} />
      <p class="mt-4 text-sm text-gray-500">Selected: {selected}</p>
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="p-8">
      <ModelPicker value={DEFAULT_PICKER_MODEL_ID} disabled onChange={() => {}} />
    </div>
  {/snippet}
</Story>
