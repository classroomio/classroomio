<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MathText, MathTextInput } from '@cio/ui/custom/math-text';
  import { INPUT_FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MathTextInput',
    component: MathTextInput,
    parameters: {
      layout: 'padded',
      controls: {
        include: INPUT_FIELDS
      }
    },
    argTypes: {
      onValueChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let titleValue = $state('Solve $x^2-5x+6=0$');
  let emptyValue = $state('');
  let optionValue = $state('$\\frac{3}{4}$');
  let legacyValue = $state('A book costs $5');
</script>

<Story name="Question Title">
  {#snippet template()}
    <div class="flex w-[28rem] flex-col gap-3">
      <MathTextInput
        value={titleValue}
        placeholder="Write your question"
        ariaLabel="Question title"
        onValueChange={(value) => (titleValue = value)}
      />
      <p class="ui:text-muted-foreground text-sm">Saved: <code>{titleValue}</code></p>
      <p class="text-sm">Rendered: <MathText text={titleValue} /></p>
    </div>
  {/snippet}
</Story>

<Story name="Empty With Placeholder">
  {#snippet template()}
    <div class="w-[28rem]">
      <MathTextInput
        value={emptyValue}
        placeholder="Option 1"
        ariaLabel="Option 1"
        onValueChange={(value) => (emptyValue = value)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Math Only Option">
  {#snippet template()}
    <div class="w-[28rem]">
      <MathTextInput value={optionValue} ariaLabel="Option 1" onValueChange={(value) => (optionValue = value)} />
    </div>
  {/snippet}
</Story>

<Story name="Legacy Text With Dollar">
  {#snippet template()}
    <div class="flex w-[28rem] flex-col gap-3">
      <MathTextInput value={legacyValue} ariaLabel="Question title" onValueChange={(value) => (legacyValue = value)} />
      <p class="ui:text-muted-foreground text-sm">Saved: <code>{legacyValue}</code></p>
    </div>
  {/snippet}
</Story>

<Story name="Invalid">
  {#snippet template()}
    <div class="w-[28rem]">
      <MathTextInput value="" placeholder="Write your question" ariaLabel="Question title" invalid />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="w-[28rem]">
      <MathTextInput value={'Find $\\sqrt{16}$'} ariaLabel="Question title" disabled />
    </div>
  {/snippet}
</Story>
