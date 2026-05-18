<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { NumberBadge } from '@cio/ui/base/number-badge';

  const { Story } = defineMeta({
    title: 'Atom/NumberBadge',
    component: NumberBadge,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Inactive">
  {#snippet template()}
    <NumberBadge number={3} />
  {/snippet}
</Story>

<Story name="Active">
  {#snippet template()}
    <NumberBadge number={3} active />
  {/snippet}
</Story>

<Story name="Locked">
  {#snippet template()}
    <NumberBadge number={3} locked />
  {/snippet}
</Story>

<Story name="With group hover">
  {#snippet template()}
    <button
      type="button"
      class="group hover:border-border flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5"
    >
      <NumberBadge number={2} />
      <span class="text-sm">Hover the row to see badge emphasis</span>
    </button>
  {/snippet}
</Story>

<Story name="Sequence">
  {#snippet template()}
    <div class="flex items-center gap-2">
      <NumberBadge number={1} />
      <NumberBadge number={2} active />
      <NumberBadge number={3} locked />
      <NumberBadge number={4} />
    </div>
  {/snippet}
</Story>
