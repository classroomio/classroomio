<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Base/Skeleton',
    component: Skeleton,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Skeleton {...args} class="h-4 w-[250px]" />
  {/snippet}
</Story>

<Story name="Circle">
  {#snippet template(args)}
    <Skeleton {...args} class="h-12 w-12 rounded-full" />
  {/snippet}
</Story>

<Story name="Card">
  {#snippet template()}
    <div class="flex items-center space-x-4">
      <Skeleton class="h-12 w-12 rounded-full" />
      <div class="space-y-2">
        <Skeleton class="h-4 w-[250px]" />
        <Skeleton class="h-4 w-[200px]" />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Multiple Lines">
  {#snippet template()}
    <div class="space-y-2">
      <Skeleton class="h-4 w-[350px]" />
      <Skeleton class="h-4 w-[300px]" />
      <Skeleton class="h-4 w-[250px]" />
      <Skeleton class="h-4 w-[200px]" />
    </div>
  {/snippet}
</Story>

<Story name="Button">
  {#snippet template(args)}
    <Skeleton {...args} class="h-10 w-20" />
  {/snippet}
</Story>

<Story name="Loading State">
  {#snippet template()}
    <div class="space-y-4 rounded-lg border p-4">
      <div class="flex items-center space-x-4">
        <Skeleton class="h-12 w-12 rounded-full" />
        <div class="space-y-2">
          <Skeleton class="h-4 w-[200px]" />
          <Skeleton class="h-4 w-40" />
        </div>
      </div>
      <Skeleton class="h-[200px] w-full" />
      <div class="flex space-x-2">
        <Skeleton class="h-8 w-16" />
        <Skeleton class="h-8 w-16" />
      </div>
    </div>
  {/snippet}
</Story>
