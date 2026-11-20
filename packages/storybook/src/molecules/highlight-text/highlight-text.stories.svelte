<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { HighlightText } from '@cio/ui/custom/highlight-text';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/HighlightText',
    component: HighlightText,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="InsideSentence">
  {#snippet template()}
    <h1 class="max-w-xl text-3xl font-semibold">
      <HighlightText text="Tell us about your team" highlight="your team" />
    </h1>
  {/snippet}
</Story>

<Story name="AtTheStart">
  {#snippet template()}
    <h1 class="max-w-xl text-3xl font-semibold">
      <HighlightText text="Stop training every customer by hand." highlight="Stop training every customer" />
    </h1>
  {/snippet}
</Story>

<Story name="WholeText">
  {#snippet template()}
    <p class="max-w-md text-lg">
      <HighlightText text="Launch a branded academy" highlight="Launch a branded academy" />
    </p>
  {/snippet}
</Story>

<Story name="HighlightMissing">
  {#snippet template()}
    <p class="max-w-md text-lg">
      <HighlightText text="Tell us about your team" highlight="your company" />
    </p>
  {/snippet}
</Story>

<Story name="Swipe">
  {#snippet template()}
    <h2 class="max-w-xl text-4xl font-extrabold tracking-tight">
      <HighlightText text="Stop training every customer by hand." highlight="by hand" variant="swipe" />
    </h2>
  {/snippet}
</Story>
