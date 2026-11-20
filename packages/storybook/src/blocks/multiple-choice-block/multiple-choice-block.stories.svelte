<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { MultipleChoiceBlockLabels, MultipleChoiceBlockOption } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const LABELS: MultipleChoiceBlockLabels = {
    editHint: 'Click a letter to mark the correct answer.',
    learnerHint: 'Choose one answer.',
    questionPlaceholder: 'Type your question',
    optionPlaceholder: 'Type an answer',
    markCorrect: 'Mark as correct answer',
    correctBadge: 'Correct answer',
    addOption: 'Add option',
    removeOption: 'Remove option',
    addMedia: 'Add media',
    imageOption: 'Image',
    removeImage: 'Remove image',
    check: 'Check answer',
    tryAgain: 'Try again',
    correctFeedback: 'Correct — well done!',
    wrongFeedback: 'Not quite. The correct answer is highlighted.'
  };

  const OPTIONS: MultipleChoiceBlockOption[] = [
    { id: 'rome', text: 'Rome' },
    { id: 'athens', text: 'Athens' },
    { id: 'lisbon', text: 'Lisbon' }
  ];

  const IMAGE_URL = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200';

  const { Story } = defineMeta({
    title: 'Blocks/MultipleChoiceBlock',
    component: Block.MultipleChoice,
    args: {
      question: 'What is the capital city of Italy?',
      options: OPTIONS,
      correctOptionId: 'rome',
      editable: false,
      minOptions: 2,
      maxOptions: 10,
      labels: LABELS
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onQuestionInput: { control: false },
      onOptionInput: { control: false },
      onMarkCorrect: { control: false },
      onAddOption: { control: false },
      onRemoveOption: { control: false },
      onAddImage: { control: false },
      onRemoveImage: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let editOptions = $state([...OPTIONS]);
  let editCorrectId = $state('rome');
  let editQuestion = $state('What is the capital city of Italy?');
  let editImage = $state(undefined);
  let nextOptionNumber = 1;

  function addOption() {
    editOptions = [...editOptions, { id: `new-${nextOptionNumber}`, text: 'New option' }];
    nextOptionNumber += 1;
  }

  function removeOption(optionId: string) {
    editOptions = editOptions.filter((option) => option.id !== optionId);
    if (editCorrectId === optionId) editCorrectId = editOptions[0].id;
  }
</script>

<Story name="Learner">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice {...args} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerWithImage">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice {...args} imageUrl={IMAGE_URL} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice
        {...args}
        editable
        question={editQuestion}
        options={editOptions}
        correctOptionId={editCorrectId}
        imageUrl={editImage}
        onQuestionInput={(question) => (editQuestion = question)}
        onOptionInput={(optionId, text) =>
          (editOptions = editOptions.map((option) => (option.id === optionId ? { ...option, text } : option)))}
        onMarkCorrect={(optionId) => (editCorrectId = optionId)}
        onAddOption={addOption}
        onRemoveOption={removeOption}
        onAddImage={() => (editImage = IMAGE_URL)}
        onRemoveImage={() => (editImage = undefined)}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditWithImage">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice {...args} editable imageUrl={IMAGE_URL} />
    </div>
  {/snippet}
</Story>

<Story name="EditAtMinimumOptions">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice {...args} editable options={OPTIONS.slice(0, 2)} />
    </div>
  {/snippet}
</Story>

<Story name="EditAtMaximumOptions">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice {...args} editable maxOptions={3} />
    </div>
  {/snippet}
</Story>

<Story name="EmptyQuestion">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.MultipleChoice
        {...args}
        editable
        question=""
        options={[
          { id: 'a', text: '' },
          { id: 'b', text: '' }
        ]}
        correctOptionId="a"
      />
    </div>
  {/snippet}
</Story>
