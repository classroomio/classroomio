<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { QuestionTypePicker } from '@cio/ui';

  const { Story } = defineMeta({
    title: 'Molecules/QuestionTypePicker',
    component: QuestionTypePicker,
    parameters: {
      layout: 'padded',
      docs: {
        description: {
          component:
            'Marketing-style question type picker with a left nav and live take-mode previews. Also published as a CDN embed (`apps/embeds`).'
        }
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <div class="ui:max-w-5xl">
      <QuestionTypePicker />
    </div>
  {/snippet}
</Story>
