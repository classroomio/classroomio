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
