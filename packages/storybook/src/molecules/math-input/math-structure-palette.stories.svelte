<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MathStructurePalette, type MathStructure } from '@cio/ui/custom/math-input';
  import { PALETTE_FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MathStructurePalette',
    component: MathStructurePalette,
    parameters: {
      layout: 'padded',
      controls: {
        include: PALETTE_FIELDS
      }
    },
    argTypes: {
      onSelect: { control: false },
      level: { control: 'select', options: ['primary', 'secondary', 'advanced'] }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let selected = $state<MathStructure | null>(null);
</script>

<Story name="Advanced">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-2">
      <MathStructurePalette
        level="advanced"
        ariaLabel="Math structures"
        onSelect={(structure) => (selected = structure)}
      />
      <p class="text-sm">Inserts: <code>{selected?.insert ?? ''}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Secondary">
  {#snippet template()}
    <div class="w-96">
      <MathStructurePalette level="secondary" ariaLabel="Math structures" onSelect={() => {}} />
    </div>
  {/snippet}
</Story>

<Story name="Primary">
  {#snippet template()}
    <div class="w-96">
      <MathStructurePalette level="primary" ariaLabel="Math structures" onSelect={() => {}} />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="w-96">
      <MathStructurePalette disabled ariaLabel="Math structures" onSelect={() => {}} />
    </div>
  {/snippet}
</Story>
