<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ExerciseQuestion } from '@cio/ui';
  import QuestionTypeModes from './question-type-modes.svelte';
  import {
    CHECKBOX_FIXTURE,
    FILE_UPLOAD_FIXTURE,
    FILL_BLANK_FIXTURE,
    HOTSPOT_FIXTURE,
    LINK_FIXTURE,
    MATCHING_FIXTURE,
    NUMERIC_FIXTURE,
    ORDERING_FIXTURE,
    RADIO_FIXTURE,
    SHORT_ANSWER_FIXTURE,
    TEXTAREA_FIXTURE,
    TRUE_FALSE_FIXTURE
  } from './question-fixtures';

  const { Story } = defineMeta({
    title: 'Molecules/ExerciseQuestion',
    component: ExerciseQuestion.QuestionRenderer,
    parameters: {
      layout: 'padded'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Checkbox">
  {#snippet template()}
    <QuestionTypeModes question={CHECKBOX_FIXTURE.question} answer={CHECKBOX_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="FileUpload">
  {#snippet template()}
    <QuestionTypeModes question={FILE_UPLOAD_FIXTURE.question} answer={FILE_UPLOAD_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="FillBlank">
  {#snippet template()}
    <QuestionTypeModes question={FILL_BLANK_FIXTURE.question} answer={FILL_BLANK_FIXTURE.answer} />
  {/snippet}
</Story>

<Story
  name="Hotspot"
  parameters={{
    docs: {
      description: {
        story:
          '**Hidden in the app** – This question type is not shown in the exercise editor dropdown. Still in development.'
      }
    }
  }}
>
  {#snippet template()}
    <div
      class="ui:mb-4 ui:rounded-md ui:border ui:border-amber-500/50 ui:bg-amber-500/10 ui:px-4 ui:py-3 ui:text-sm ui:text-amber-800 ui:dark:text-amber-200"
    >
      <strong>Hidden – still in development.</strong> Not available in the exercise editor.
    </div>
    <QuestionTypeModes question={HOTSPOT_FIXTURE.question} answer={HOTSPOT_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="Link">
  {#snippet template()}
    <QuestionTypeModes question={LINK_FIXTURE.question} answer={LINK_FIXTURE.answer} />
  {/snippet}
</Story>

<Story
  name="Matching"
  parameters={{
    docs: {
      description: {
        story:
          '**Hidden in the app** – This question type is not shown in the exercise editor dropdown. Still in development.'
      }
    }
  }}
>
  {#snippet template()}
    <div
      class="ui:mb-4 ui:rounded-md ui:border ui:border-amber-500/50 ui:bg-amber-500/10 ui:px-4 ui:py-3 ui:text-sm ui:text-amber-800 ui:dark:text-amber-200"
    >
      <strong>Hidden – still in development.</strong> Not available in the exercise editor.
    </div>
    <QuestionTypeModes question={MATCHING_FIXTURE.question} answer={MATCHING_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="Numeric">
  {#snippet template()}
    <QuestionTypeModes question={NUMERIC_FIXTURE.question} answer={NUMERIC_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="Ordering">
  {#snippet template()}
    <QuestionTypeModes question={ORDERING_FIXTURE.question} answer={ORDERING_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="Radio">
  {#snippet template()}
    <QuestionTypeModes question={RADIO_FIXTURE.question} answer={RADIO_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="ShortAnswer">
  {#snippet template()}
    <QuestionTypeModes question={SHORT_ANSWER_FIXTURE.question} answer={SHORT_ANSWER_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="Textarea">
  {#snippet template()}
    <QuestionTypeModes question={TEXTAREA_FIXTURE.question} answer={TEXTAREA_FIXTURE.answer} />
  {/snippet}
</Story>

<Story name="TrueFalse">
  {#snippet template()}
    <QuestionTypeModes question={TRUE_FALSE_FIXTURE.question} answer={TRUE_FALSE_FIXTURE.answer} />
  {/snippet}
</Story>
