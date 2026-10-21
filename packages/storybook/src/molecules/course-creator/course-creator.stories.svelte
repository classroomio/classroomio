<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CourseCreator } from '@cio/ui/custom/course-creator';

  const { Story } = defineMeta({
    title: 'Molecules/CourseCreator',
    component: CourseCreator,
    parameters: {
      layout: 'centered',
      backgrounds: {
        default: 'dark',
        values: [{ name: 'dark', value: '#000000' }]
      }
    },
    tags: ['autodocs']
  });
</script>

<script>
  const heading = 'What course do you want to create?';
  const placeholder = 'Ask what you want to learn...';
  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  const longPrompt = [
    'I want to build a comprehensive course about modern web development.',
    'It should cover semantic HTML, accessibility, responsive CSS layout, and component-driven UI.',
    'Include a module on JavaScript fundamentals, the event loop, async/await, and fetch.',
    'Add a module on TypeScript generics, narrowing, and module resolution.',
    'Finish with testing, performance budgets, and deployment to a CDN.',
    'The audience is intermediate developers who know the basics of HTML and CSS.'
  ].join('\n\n');
</script>

<Story name="Default">
  {#snippet template()}
    <div class="w-[800px] p-8">
      <CourseCreator {heading} {placeholder} {levelOptions} onsubmit={(p) => console.log('submit', p)} />
    </div>
  {/snippet}
</Story>

<Story name="Loading">
  {#snippet template()}
    <div class="w-[800px] p-8">
      <CourseCreator {heading} {placeholder} {levelOptions} loading={true} onsubmit={(p) => console.log('submit', p)} />
    </div>
  {/snippet}
</Story>

<Story name="Long Prompt">
  {#snippet template()}
    <div class="w-[800px] p-8">
      <CourseCreator
        {heading}
        {placeholder}
        {levelOptions}
        prompt={longPrompt}
        onsubmit={(p) => console.log('submit', p)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Custom Options">
  {#snippet template()}
    <div class="w-[800px] p-8">
      <CourseCreator
        {heading}
        {placeholder}
        levelOptions={[
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' },
          { value: 'expert', label: 'Expert' }
        ]}
        onsubmit={(p) => console.log('submit', p)}
      />
    </div>
  {/snippet}
</Story>
