<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { ProcessBlockLabels, ProcessBlockStep } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const LABELS: ProcessBlockLabels = {
    stepper: 'Steps',
    goToStep: (step) => `Go to step ${step}`,
    untitledStep: 'Untitled step',
    headingPlaceholder: 'Step heading',
    bodyPlaceholder: 'Describe this step',
    addMedia: 'Add media',
    imageOption: 'Image',
    removeImage: 'Remove image',
    deleteStep: 'Delete this step',
    addStep: 'Add step',
    back: 'Back',
    next: 'Next',
    startOver: 'Start over',
    progress: 'Process progress'
  };

  const IMAGE_URL = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200';

  const STEPS: ProcessBlockStep[] = [
    {
      id: 'intro',
      heading: 'Introduction',
      body: 'Artificial intelligence, or AI, has become one of the most transformative and rapidly evolving fields in technology.'
    },
    { id: 'how', heading: 'How it works', body: 'Describe what happens in this step of the process.' },
    { id: 'use', heading: 'Putting it to use', body: 'Show how learners apply what they have just seen.' }
  ];

  const STEPS_WITH_IMAGE: ProcessBlockStep[] = STEPS.map((step, index) =>
    index === 0 ? { ...step, imageUrl: IMAGE_URL } : step
  );

  const MANY_STEPS: ProcessBlockStep[] = Array.from({ length: 12 }, (_, index) => ({
    id: `step-${index + 1}`,
    heading: `Stage ${index + 1}`,
    body: 'Each stage gets its own circle in the stepper.'
  }));

  const { Story } = defineMeta({
    title: 'Blocks/ProcessBlock',
    component: Block.Process,
    args: {
      steps: STEPS,
      editable: false,
      maxSteps: 20,
      labels: LABELS
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onHeadingInput: { control: false },
      onBodyInput: { control: false },
      onAddStep: { control: false },
      onRemoveStep: { control: false },
      onAddImage: { control: false },
      onRemoveImage: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let editSteps = $state([...STEPS]);
  let nextStepNumber = 1;

  function updateStep(stepId: string, changes: Partial<ProcessBlockStep>) {
    editSteps = editSteps.map((step) => (step.id === stepId ? { ...step, ...changes } : step));
  }

  function addStep() {
    editSteps = [...editSteps, { id: `new-${nextStepNumber}`, heading: 'New step', body: 'Describe this step.' }];
    nextStepNumber += 1;
  }
</script>

<Story name="Learner">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process {...args} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerWithImage">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process {...args} steps={STEPS_WITH_IMAGE} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerSingleStep">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process {...args} steps={STEPS.slice(0, 1)} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process
        {...args}
        editable
        steps={editSteps}
        onHeadingInput={(stepId, heading) => updateStep(stepId, { heading })}
        onBodyInput={(stepId, body) => updateStep(stepId, { body })}
        onAddStep={addStep}
        onRemoveStep={(stepId) => (editSteps = editSteps.filter((step) => step.id !== stepId))}
        onAddImage={(stepId) => updateStep(stepId, { imageUrl: IMAGE_URL })}
        onRemoveImage={(stepId) => updateStep(stepId, { imageUrl: undefined })}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditWithImage">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process {...args} editable steps={STEPS_WITH_IMAGE} />
    </div>
  {/snippet}
</Story>

<Story name="EditUntitledStep">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process {...args} editable steps={[{ id: 'empty', heading: '', body: '' }, ...STEPS.slice(1)]} />
    </div>
  {/snippet}
</Story>

<Story name="EditAtMaximumSteps">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Process {...args} editable steps={MANY_STEPS} maxSteps={12} />
    </div>
  {/snippet}
</Story>

<Story name="Narrow">
  {#snippet template(args)}
    <div class="w-[360px]">
      <Block.Process {...args} steps={STEPS_WITH_IMAGE} />
    </div>
  {/snippet}
</Story>
