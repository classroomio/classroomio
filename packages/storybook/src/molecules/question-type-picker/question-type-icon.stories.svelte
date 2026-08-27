<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { QuestionTypeIcon } from '@cio/ui';
  import { ENABLED_QUESTION_TYPE_REGISTRY } from '@cio/question-types';

  const { Story } = defineMeta({
    title: 'Molecules/QuestionTypeIcon',
    component: QuestionTypeIcon,
    parameters: {
      layout: 'padded',
      docs: {
        description: {
          component: 'Renders a question type glyph tile or Lucide icon based on question type key or numeric typeId.'
        }
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="All Types">
  {#snippet template()}
    <div class="ui:flex ui:flex-wrap ui:gap-4 ui:p-4">
      {#each ENABLED_QUESTION_TYPE_REGISTRY as type (type.id)}
        <div class="ui:flex ui:flex-col ui:items-center ui:gap-2 ui:rounded-lg ui:border ui:p-3 ui:w-28">
          <QuestionTypeIcon typeId={type.id} />
          <span class="ui:text-xs ui:font-medium ui:text-center ui:text-foreground">{type.label}</span>
          <span class="ui:text-[10px] ui:text-muted-foreground">{type.key}</span>
        </div>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Sizes">
  {#snippet template()}
    <div class="ui:flex ui:items-center ui:gap-4 ui:p-4">
      <div class="ui:flex ui:items-center ui:gap-2">
        <QuestionTypeIcon key="RADIO" class="ui:size-5" />
        <span class="ui:text-xs">Small (20px)</span>
      </div>
      <div class="ui:flex ui:items-center ui:gap-2">
        <QuestionTypeIcon key="RADIO" class="ui:size-7" />
        <span class="ui:text-xs">Default (28px)</span>
      </div>
      <div class="ui:flex ui:items-center ui:gap-2">
        <QuestionTypeIcon key="RADIO" class="ui:size-10" />
        <span class="ui:text-xs">Large (40px)</span>
      </div>
    </div>
  {/snippet}
</Story>
