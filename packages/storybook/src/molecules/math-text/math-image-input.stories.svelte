<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    DEFAULT_MATH_EDIT_LABELS,
    DEFAULT_MATH_IMAGE_LABELS,
    MathEditPopover,
    MathImageInput,
    MathImagePopover
  } from '@cio/ui/custom/math-text';
  import MockMathImageProvider from './mock-math-image-provider.svelte';
  import { IMAGE_FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MathImageInput',
    component: MathImageInput,
    parameters: {
      layout: 'padded',
      controls: {
        include: IMAGE_FIELDS
      }
    },
    argTypes: {
      converter: { control: false },
      onInsert: { control: false }
    },
    tags: ['autodocs']
  });

  async function convertWith(outcome: 'valid' | 'unparsable' | 'empty' | 'error') {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (outcome === 'error') throw new Error('Free plan image conversions are used up for this month.');
    if (outcome === 'unparsable') return { latex: '\\frac{1}{', valid: false, parseError: 'PARSE_FAILED' };
    if (outcome === 'empty') return { latex: '', valid: false, parseError: 'NO_MATH_FOUND' };

    return { latex: '\\frac{1}{2}+\\frac{1}{3}', valid: true };
  }
</script>

<script lang="ts">
  let inserted = $state('');
  let popoverAnchor = $state<HTMLElement | null>(null);
  let isPopoverOpen = $state(false);
  let popoverLatex = $state('');
  let savedLatex = $state('');
</script>

<Story name="Photo">
  {#snippet template(args)}
    <div class="max-w-xl space-y-3">
      <MathImageInput
        {...args}
        mode="photo"
        converter={{ labels: DEFAULT_MATH_IMAGE_LABELS, convert: () => convertWith('valid') }}
        onInsert={(latex) => (inserted = latex)}
      />
      <p class="ui:text-muted-foreground text-sm">Inserted: <code>{inserted}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Draw">
  {#snippet template(args)}
    <div class="max-w-xl space-y-3">
      <MathImageInput
        {...args}
        mode="draw"
        converter={{ labels: DEFAULT_MATH_IMAGE_LABELS, convert: () => convertWith('valid') }}
        onInsert={(latex) => (inserted = latex)}
      />
      <p class="ui:text-muted-foreground text-sm">Inserted: <code>{inserted}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Draw Unparsable Result">
  {#snippet template(args)}
    <div class="max-w-xl">
      <MathImageInput
        {...args}
        mode="draw"
        converter={{ labels: DEFAULT_MATH_IMAGE_LABELS, convert: () => convertWith('unparsable') }}
        onInsert={(latex) => (inserted = latex)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Draw No Math Found">
  {#snippet template(args)}
    <div class="max-w-xl">
      <MathImageInput
        {...args}
        mode="draw"
        converter={{ labels: DEFAULT_MATH_IMAGE_LABELS, convert: () => convertWith('empty') }}
        onInsert={(latex) => (inserted = latex)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Draw Plan Limit Reached">
  {#snippet template(args)}
    <div class="max-w-xl">
      <MathImageInput
        {...args}
        mode="draw"
        converter={{ labels: DEFAULT_MATH_IMAGE_LABELS, convert: () => convertWith('error') }}
        onInsert={(latex) => (inserted = latex)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Math Box With Photo And Draw Tabs">
  {#snippet template()}
    <MockMathImageProvider>
      <div class="flex h-[32rem] flex-col items-start gap-3">
        <button
          bind:this={popoverAnchor}
          type="button"
          class="rounded border px-3 py-1"
          onclick={() => (isPopoverOpen = true)}
        >
          Edit formula
        </button>
        <p class="ui:text-muted-foreground text-sm">Saved: <code>{savedLatex}</code></p>
        <MathEditPopover
          bind:open={isPopoverOpen}
          bind:latex={popoverLatex}
          anchor={popoverAnchor}
          labels={DEFAULT_MATH_EDIT_LABELS}
          onSave={(value) => (savedLatex = value)}
          onCancel={() => (popoverLatex = savedLatex)}
        />
      </div>
    </MockMathImageProvider>
  {/snippet}
</Story>

<Story name="Student Answer Box Button">
  {#snippet template()}
    <MockMathImageProvider>
      <div class="flex h-[32rem] flex-col items-start gap-3">
        <MathImagePopover onInsert={(latex) => (inserted = latex)} />
        <p class="ui:text-muted-foreground text-sm">Inserted: <code>{inserted}</code></p>
      </div>
    </MockMathImageProvider>
  {/snippet}
</Story>
