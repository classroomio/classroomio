<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Calculator, CalculatorDock } from '@cio/ui/custom/calculator';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Calculator',
    component: Calculator,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      mode: { control: 'select', options: ['four_function', 'scientific'] },
      labels: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Four Function">
  {#snippet template()}
    <Calculator mode="four_function" />
  {/snippet}
</Story>

<Story name="Scientific">
  {#snippet template()}
    <Calculator mode="scientific" />
  {/snippet}
</Story>

<Story name="Dock Scientific Open">
  {#snippet template()}
    <div class="h-[34rem]">
      <CalculatorDock policy="scientific" defaultOpen />
    </div>
  {/snippet}
</Story>

<Story name="Dock Four Function Open">
  {#snippet template()}
    <div class="h-[26rem]">
      <CalculatorDock policy="four_function" defaultOpen />
    </div>
  {/snippet}
</Story>

<Story name="Dock Graphing Without Desmos Key Falls Back To Scientific">
  {#snippet template()}
    <div class="h-[34rem]">
      <CalculatorDock policy="graphing" defaultOpen />
    </div>
  {/snippet}
</Story>

<Story name="Dock None Renders Nothing">
  {#snippet template()}
    <div class="h-24">
      <CalculatorDock policy="none" />
      <p class="text-muted-foreground text-sm">No calculator is shown when the policy is none.</p>
    </div>
  {/snippet}
</Story>
