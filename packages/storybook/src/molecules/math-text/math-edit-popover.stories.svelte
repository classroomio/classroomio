<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DEFAULT_MATH_EDIT_LABELS, MathEditPopover, MathLatexField } from '@cio/ui/custom/math-text';
  import { POPOVER_FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MathEditPopover',
    component: MathEditPopover,
    parameters: {
      layout: 'padded',
      controls: {
        include: POPOVER_FIELDS
      }
    },
    argTypes: {
      onSave: { control: false },
      onCancel: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let anchor = $state<HTMLElement | null>(null);
  let isOpen = $state(true);
  let latex = $state('\\frac{a}{b}');
  let savedLatex = $state('\\frac{a}{b}');

  let primaryAnchor = $state<HTMLElement | null>(null);
  let isPrimaryOpen = $state(false);
  let primaryLatex = $state('\\frac{1}{2}');

  let emptyFieldValue = $state('');
  let validFieldValue = $state('x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  let invalidFieldValue = $state('\\frac{1}{');
</script>

<Story name="Popover">
  {#snippet template()}
    <div class="flex h-80 flex-col items-start gap-3">
      <button bind:this={anchor} type="button" class="rounded border px-3 py-1" onclick={() => (isOpen = true)}>
        Edit formula
      </button>
      <p class="ui:text-muted-foreground text-sm">Saved: <code>{savedLatex}</code></p>
      <MathEditPopover
        bind:open={isOpen}
        bind:latex
        {anchor}
        labels={DEFAULT_MATH_EDIT_LABELS}
        onSave={(value) => (savedLatex = value)}
        onCancel={() => (latex = savedLatex)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Popover Primary Level Numeric Keyboard">
  {#snippet template()}
    <div class="flex h-80 flex-col items-start gap-3">
      <button
        bind:this={primaryAnchor}
        type="button"
        class="rounded border px-3 py-1"
        onclick={() => (isPrimaryOpen = true)}
      >
        Edit fraction
      </button>
      <MathEditPopover
        bind:open={isPrimaryOpen}
        bind:latex={primaryLatex}
        anchor={primaryAnchor}
        keyboard="numeric"
        level="primary"
        labels={DEFAULT_MATH_EDIT_LABELS}
        onSave={() => {}}
        onCancel={() => {}}
      />
    </div>
  {/snippet}
</Story>

<Story name="LaTeX Field Empty">
  {#snippet template()}
    <div class="w-80">
      <MathLatexField bind:value={emptyFieldValue} labels={DEFAULT_MATH_EDIT_LABELS} />
    </div>
  {/snippet}
</Story>

<Story name="LaTeX Field With Preview">
  {#snippet template()}
    <div class="w-80">
      <MathLatexField bind:value={validFieldValue} labels={DEFAULT_MATH_EDIT_LABELS} />
    </div>
  {/snippet}
</Story>

<Story name="LaTeX Field With Error">
  {#snippet template()}
    <div class="w-80">
      <MathLatexField bind:value={invalidFieldValue} labels={DEFAULT_MATH_EDIT_LABELS} />
    </div>
  {/snippet}
</Story>
