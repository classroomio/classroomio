<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Field from '@cio/ui/base/field';
  import { CheckboxOptionCard, CheckboxOptionCardGroup } from '@cio/ui/custom/checkbox-option-card';
  import { Badge } from '@cio/ui/base/badge';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/CheckboxOptionCard',
    component: CheckboxOptionCard,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let selectedCourses = $state<string[]>(['intro-html']);
  let selectedFeatures = $state<string[]>(['certificates', 'live-classes']);
  let selectedAudiences = $state<string[]>([]);

  const courseOptions = [
    {
      id: 'intro-html',
      title: 'Introduction to HTML',
      description: '12 lessons · Self-paced',
      value: 'intro-html'
    },
    {
      id: 'css-fundamentals',
      title: 'CSS Fundamentals',
      description: '18 lessons · Self-paced',
      value: 'css-fundamentals'
    },
    {
      id: 'js-essentials',
      title: 'JavaScript Essentials',
      description: '24 lessons · Live class',
      value: 'js-essentials'
    },
    {
      id: 'svelte-bootcamp',
      title: 'Svelte Bootcamp',
      description: 'Coming soon',
      value: 'svelte-bootcamp',
      disabled: true
    }
  ];

  const featureOptions = [
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'Issue completion certificates to students.',
      value: 'certificates'
    },
    {
      id: 'live-classes',
      title: 'Live classes',
      description: 'Schedule and host real-time lessons.',
      value: 'live-classes'
    },
    {
      id: 'compliance',
      title: 'Compliance tracking',
      description: 'Track required training across teams.',
      value: 'compliance'
    }
  ];

  const audienceOptions = [
    { id: 'students', title: 'Students', description: 'Anyone enrolled in a course.', value: 'students' },
    { id: 'tutors', title: 'Tutors', description: 'Course facilitators and graders.', value: 'tutors' },
    { id: 'admins', title: 'Admins', description: 'Organization administrators.', value: 'admins' }
  ];
</script>

<Story name="Course Picker (stacked horizontally)">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-xl">
      <Field.Description class="ui:mb-4 ui:block">
        Pick one or more courses. Each card stacks vertically and lays out title and checkbox horizontally.
      </Field.Description>
      <CheckboxOptionCardGroup options={courseOptions} bind:value={selectedCourses} class="ui:grid-cols-1" />
      <p class="ui:mt-3 ui:text-muted-foreground ui:text-sm">Selected: {selectedCourses.join(', ') || 'none'}</p>
    </div>
  {/snippet}
</Story>

<Story name="Feature Toggles (Group)">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-xl">
      <Field.Description class="ui:mb-4 ui:block">
        Toggle one or more product features. Bound value is an array of selected option values.
      </Field.Description>
      <CheckboxOptionCardGroup options={featureOptions} bind:value={selectedFeatures} />
      <p class="ui:mt-3 ui:text-muted-foreground ui:text-sm">Selected: {selectedFeatures.join(', ') || 'none'}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Disabled Option and Title Suffix">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-xl">
      <Field.Description class="ui:mb-4 ui:block">
        Use the <code>titleSuffix(option)</code> snippet to render per-option content.
      </Field.Description>
      <CheckboxOptionCardGroup options={courseOptions} bind:value={selectedCourses}>
        {#snippet titleSuffix(option)}
          {#if option.disabled}
            <Badge variant="secondary" class="ui:text-xs">Coming soon</Badge>
          {/if}
        {/snippet}
      </CheckboxOptionCardGroup>
    </div>
  {/snippet}
</Story>

<Story name="Custom Columns (Group class override)">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-3xl">
      <Field.Description class="ui:mb-4 ui:block">
        Override grid with the <code>class</code> prop on <code>CheckboxOptionCardGroup</code>.
      </Field.Description>
      <CheckboxOptionCardGroup
        options={audienceOptions}
        bind:value={selectedAudiences}
        class="ui:grid-cols-1 ui:sm:grid-cols-2 ui:lg:grid-cols-3"
      />
      <p class="ui:mt-3 ui:text-muted-foreground ui:text-sm">Selected: {selectedAudiences.join(', ') || 'none'}</p>
    </div>
  {/snippet}
</Story>
