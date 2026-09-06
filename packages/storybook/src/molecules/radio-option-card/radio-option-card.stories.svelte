<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import * as Field from '@cio/ui/base/field';
  import { RadioOptionCard, RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
  import { Badge } from '@cio/ui/base/badge';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/RadioOptionCard',
    component: RadioOptionCard,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let courseType = $state('live-class');
  let contentType = $state('lesson');
  let exerciseCreateType = $state('from-scratch');
  let deliveryMethod = $state('live');

  const courseTypeOptions = [
    {
      id: 'live-class',
      title: 'Live Class',
      description: 'Schedule live sessions with your students. Best for real-time instruction and Q&A.',
      value: 'live-class'
    },
    {
      id: 'self-paced',
      title: 'Self-Paced',
      description: 'Students progress at their own speed. Add lessons, exercises, and deadlines as needed.',
      value: 'self-paced'
    }
  ];

  const contentTypeOptions = [
    { id: 'section', title: 'Section', description: 'Group lessons and exercises together.', value: 'section' },
    { id: 'lesson', title: 'Lesson', description: 'Teach with notes, slides, and videos.', value: 'lesson' },
    { id: 'exercise', title: 'Exercise', description: 'Assess students with quizzes and tasks.', value: 'exercise' }
  ];

  const exerciseCreateOptions = [
    {
      id: 'from-scratch',
      title: 'From scratch',
      description: 'Create a new exercise with your own questions and settings.',
      value: 'from-scratch'
    },
    {
      id: 'use-template',
      title: 'Use template',
      description: 'Start from a pre-built exercise template.',
      value: 'use-template',
      disabled: true
    }
  ];

  const deliveryOptions = [
    { id: 'live', title: 'Live', description: 'Real-time sessions with your students.', value: 'live' },
    { id: 'async', title: 'Async', description: 'Pre-recorded lessons and self-paced work.', value: 'async' },
    { id: 'hybrid', title: 'Hybrid', description: 'Mix of live and async activities.', value: 'hybrid' },
    {
      id: 'ondemand',
      title: 'On-demand',
      description: 'Fully self-paced, no fixed schedule.',
      value: 'ondemand'
    }
  ];
</script>

<Story name="Course Type Selector (Group)">
  {#snippet template()}
    <div class="w-full max-w-xl">
      <Field.Description class="mb-4 block">Choose how your course will be delivered to students.</Field.Description>
      <RadioOptionCardGroup options={courseTypeOptions} bind:value={courseType} />
      <p class="ui:text-muted-foreground mt-3 text-sm">Selected: {courseType}</p>
    </div>
  {/snippet}
</Story>

<Story name="Add Content Type (Group, 3 columns)">
  {#snippet template()}
    <div class="w-full max-w-2xl">
      <Field.Description class="mb-4 block">
        Add a new item to your course. Sections group lessons and exercises.
      </Field.Description>
      <RadioOptionCardGroup options={contentTypeOptions} bind:value={contentType} class="md:grid-cols-3" />
      <p class="ui:text-muted-foreground mt-3 text-sm">Selected: {contentType}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Disabled Option and Title Suffix (Group)">
  {#snippet template()}
    <div class="w-full max-w-xl">
      <Field.Description class="mb-4 block">
        How would you like to create your exercise? Use the <code>titleSuffix(option)</code> snippet to render per-option
        content (e.g. Coming soon for disabled).
      </Field.Description>
      <RadioOptionCardGroup options={exerciseCreateOptions} bind:value={exerciseCreateType}>
        {#snippet titleSuffix(option)}
          {#if option.disabled}
            <Badge variant="secondary" class="text-xs">Coming soon</Badge>
          {/if}
        {/snippet}
      </RadioOptionCardGroup>
      <p class="ui:text-muted-foreground mt-3 text-sm">Selected: {exerciseCreateType}</p>
    </div>
  {/snippet}
</Story>

<Story name="Custom Columns (Group class override)">
  {#snippet template()}
    <div class="w-full max-w-3xl">
      <Field.Description class="mb-4 block">
        Override grid with the <code>class</code> prop on <code>RadioOptionCardGroup</code> (uses <code>cn</code> so your
        classes win).
      </Field.Description>
      <RadioOptionCardGroup
        options={deliveryOptions}
        bind:value={deliveryMethod}
        class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      />
      <p class="ui:text-muted-foreground mt-3 text-sm">Selected: {deliveryMethod}</p>
    </div>
  {/snippet}
</Story>

<Story name="Individual cards (card class prop)">
  {#snippet template()}
    <div class="w-full max-w-3xl">
      <Field.Description class="mb-4 block">
        When using <code>RadioOptionCard</code> inside <code>RadioGroup.Root</code>, override per card with the card
        <code>class</code>
        prop (e.g. <code>lg:col-span-2</code>).
      </Field.Description>
      <RadioGroup.Root bind:value={deliveryMethod} class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RadioOptionCard id="live" title="Live" description="Real-time sessions with your students." value="live" />
        <RadioOptionCard
          id="async"
          title="Async"
          description="Pre-recorded lessons and self-paced work."
          value="async"
        />
        <RadioOptionCard id="hybrid" title="Hybrid" description="Mix of live and async activities." value="hybrid" />
        <RadioOptionCard
          id="ondemand"
          title="On-demand"
          description="Fully self-paced, no fixed schedule."
          value="ondemand"
          class="lg:col-span-2"
        />
      </RadioGroup.Root>
      <p class="ui:text-muted-foreground mt-3 text-sm">Selected: {deliveryMethod}</p>
    </div>
  {/snippet}
</Story>
