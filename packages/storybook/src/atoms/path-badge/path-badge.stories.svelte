<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PathBadge } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/PathBadge',
    component: PathBadge,
    parameters: {
      layout: 'centered',
      controls: { include: FIELDS }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Cover (Learning Path)">
  {#snippet template()}
    <div class="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-6">
      <PathBadge type="learning-path" variant="cover" />
    </div>
  {/snippet}
</Story>

<Story name="Cover (Course)">
  {#snippet template()}
    <div class="rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
      <PathBadge type="course" variant="cover" />
    </div>
  {/snippet}
</Story>

<Story name="Body (Learning Path)">
  {#snippet template()}
    <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <PathBadge type="learning-path" variant="body" />
    </div>
  {/snippet}
</Story>

<Story name="Body (Course)">
  {#snippet template()}
    <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <PathBadge type="course" variant="body" />
    </div>
  {/snippet}
</Story>

<Story name="All Variants">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-6">
        <PathBadge type="learning-path" variant="cover" />
        <PathBadge type="course" variant="cover" />
      </div>
      <div
        class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <PathBadge type="learning-path" variant="body" />
        <PathBadge type="course" variant="body" />
      </div>
    </div>
  {/snippet}
</Story>
