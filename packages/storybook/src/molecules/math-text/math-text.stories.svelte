<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MathText } from '@cio/ui/custom/math-text';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MathText',
    component: MathText,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Inline Math" args={{ text: 'Solve $x^2-5x+6=0$ for $x$.' }} />

<Story name="Display Math" args={{ text: 'Evaluate $$\\int_0^1 x^2\\,dx$$' }} />

<Story name="Fraction Option" args={{ text: '$\\frac{3}{4}$' }} />

<Story name="Plain Text" args={{ text: 'What is the capital of France?' }} />

<Story name="Currency Stays Text" args={{ text: 'A book costs $5 and a pen costs $2.' }} />

<Story name="Escaped Dollar" args={{ text: 'Write \\$x\\$ to show a literal dollar sign.' }} />

<Story
  name="Editor Math Element"
  args={{ text: 'Area: <span data-type="inline-math" data-latex="A = \\pi r^2"></span>' }}
/>

<Story name="Invalid LaTeX" args={{ text: 'Broken: $\\frac{1}{$' }} />

<Story name="In A Heading">
  {#snippet template()}
    <h4 class="font-medium">
      <MathText text={'Which value of $x$ satisfies $\\sqrt{x+1} = 3$?'} />
    </h4>
  {/snippet}
</Story>
