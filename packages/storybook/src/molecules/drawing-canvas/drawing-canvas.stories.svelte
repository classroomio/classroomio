<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DrawingCanvas } from '@cio/ui/custom/drawing-canvas';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/DrawingCanvas',
    component: DrawingCanvas,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onSave: { control: false },
      labels: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let savedUrl = $state('');

  async function handleSave(file: File) {
    savedUrl = URL.createObjectURL(file);
  }
</script>

<Story name="Default">
  {#snippet template()}
    <div class="flex max-w-xl flex-col gap-3">
      <DrawingCanvas onSave={handleSave} />
      {#if savedUrl}
        <img src={savedUrl} alt="Saved drawing" class="max-h-40 rounded-md border" />
      {/if}
    </div>
  {/snippet}
</Story>

<Story name="Taller">
  {#snippet template()}
    <div class="max-w-xl">
      <DrawingCanvas onSave={handleSave} height={420} />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="max-w-xl">
      <DrawingCanvas onSave={handleSave} disabled />
    </div>
  {/snippet}
</Story>
