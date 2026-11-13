<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MathInput,
    MathStructurePalette,
    type MathInputValue,
    type MathKeyboardLayout
  } from '@cio/ui/custom/math-input';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MathInput',
    component: MathInput,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onInput: { control: false },
      onSubmit: { control: false },
      keyboard: {
        control: 'select',
        options: ['numeric', 'algebra', 'calculus', 'greek', 'sets', 'full']
      }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let answer = $state('2x+2');
  let lastInput = $state<MathInputValue | null>(null);
  let emptyValue = $state('');
  let paletteValue = $state('');
  let paletteInput = $state<ReturnType<typeof MathInput> | null>(null);
  let submitted = $state('');
  let submitValue = $state('x^2');

  const unitsLayout: MathKeyboardLayout = {
    label: 'Units',
    rows: [
      ['[7]', '[8]', '[9]', '\\mathrm{m}', '\\mathrm{cm}', '[backspace]'],
      ['[4]', '[5]', '[6]', '\\mathrm{kg}', '\\mathrm{g}', '[left]'],
      ['[1]', '[2]', '[3]', '\\mathrm{s}', '\\mathrm{h}', '[right]'],
      ['[0]', '[.]', '[-]', '\\frac{#@}{#?}', '#@^{#?}', '[return]']
    ]
  };
</script>

<Story name="Default">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-3">
      <MathInput bind:value={answer} ariaLabel="Your answer" onInput={(next) => (lastInput = next)} />
      <p class="text-sm">LaTeX: <code>{answer}</code></p>
      <p class="text-sm">MathJSON: <code>{JSON.stringify(lastInput?.mathjson ?? null)}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Empty With Placeholder">
  {#snippet template()}
    <div class="w-96">
      <MathInput bind:value={emptyValue} placeholder="Type your answer" ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Numeric Keyboard">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'\\frac{3}{4}'} keyboard="numeric" ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Calculus Keyboard">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'\\int_0^1 x^2\\,dx'} keyboard="calculus" ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Greek Keyboard">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'2\\pi r'} keyboard="greek" ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Sets Keyboard">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'A\\cup B'} keyboard="sets" ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Full Keyboard">
  {#snippet template()}
    <div class="w-96">
      <MathInput value="" keyboard="full" ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Custom Keyboard Layout">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'5\\mathrm{m}'} keyboard={[unitsLayout, 'numeric']} ariaLabel="Distance" />
    </div>
  {/snippet}
</Story>

<Story name="With Structure Palette">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-2">
      <MathStructurePalette level="advanced" onSelect={(structure) => paletteInput?.insert(structure.insert)} />
      <MathInput bind:this={paletteInput} bind:value={paletteValue} keyboard="full" ariaLabel="Formula" />
      <p class="text-sm">LaTeX: <code>{paletteValue}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Submit On Enter">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-2">
      <MathInput bind:value={submitValue} ariaLabel="Your answer" onSubmit={() => (submitted = submitValue)} />
      <p class="text-sm">Submitted: <code>{submitted}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Invalid">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'x+'} invalid ariaLabel="Your answer" />
    </div>
  {/snippet}
</Story>

<Story name="Read Only">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}'} readonly ariaLabel="Answer" />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="w-96">
      <MathInput value={'\\sqrt{16}'} disabled ariaLabel="Answer" />
    </div>
  {/snippet}
</Story>
