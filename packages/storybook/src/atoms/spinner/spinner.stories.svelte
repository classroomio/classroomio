<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Spinner } from '@cio/ui/base/spinner';

  const { Story } = defineMeta({
    title: 'Atom/Spinner',
    component: Spinner,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Spinner />
  {/snippet}
</Story>

<Story name="Small">
  {#snippet template()}
    <Spinner class="h-4 w-4" />
  {/snippet}
</Story>

<Story name="Large">
  {#snippet template()}
    <Spinner class="h-12 w-12" />
  {/snippet}
</Story>

<Story name="Custom Color">
  {#snippet template()}
    <div class="flex gap-4">
      <Spinner class="text-blue-500" />
      <Spinner class="text-green-500" />
      <Spinner class="text-red-500" />
      <Spinner class="text-purple-500" />
    </div>
  {/snippet}
</Story>

<Story name="With Text">
  {#snippet template()}
    <div class="flex items-center gap-2">
      <Spinner />
      <span>Loading...</span>
    </div>
  {/snippet}
</Story>
