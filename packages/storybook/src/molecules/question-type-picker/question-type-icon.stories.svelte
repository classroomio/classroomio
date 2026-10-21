<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { QuestionTypeIcon } from '@cio/ui';
  import { ENABLED_QUESTION_TYPE_REGISTRY } from '@cio/question-types';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/QuestionTypeIcon',
    component: QuestionTypeIcon,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      },
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
    <div class="flex flex-wrap gap-4 p-4">
      {#each ENABLED_QUESTION_TYPE_REGISTRY as type (type.id)}
        <div class="flex w-28 flex-col items-center gap-2 rounded-lg border p-3">
          <QuestionTypeIcon typeId={type.id} />
          <span class="ui:text-foreground text-center text-xs font-medium">{type.label}</span>
          <span class="ui:text-muted-foreground text-[10px]">{type.key}</span>
        </div>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Sizes">
  {#snippet template()}
    <div class="flex items-center gap-4 p-4">
      <div class="flex items-center gap-2">
        <QuestionTypeIcon key="RADIO" class="size-5" />
        <span class="text-xs">Small (20px)</span>
      </div>
      <div class="flex items-center gap-2">
        <QuestionTypeIcon key="RADIO" class="size-7" />
        <span class="text-xs">Default (28px)</span>
      </div>
      <div class="flex items-center gap-2">
        <QuestionTypeIcon key="RADIO" class="size-10" />
        <span class="text-xs">Large (40px)</span>
      </div>
    </div>
  {/snippet}
</Story>
