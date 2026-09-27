<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ChevronsUpDownIcon } from '@cio/ui/custom/moving-icons';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/ChevronsUpDown',
    component: ChevronsUpDownIcon,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      class: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Rest" args={{ size: 24 }}>
  {#snippet template(args)}
    <ChevronsUpDownIcon {...args} />
  {/snippet}
</Story>

<Story name="Animated" args={{ size: 24, animate: true }}>
  {#snippet template(args)}
    <ChevronsUpDownIcon {...args} />
  {/snippet}
</Story>

<Story name="Decorative" args={{ size: 16, ariaHidden: true }}>
  {#snippet template(args)}
    <span class="inline-flex items-center gap-1 text-sm font-medium">
      Template gallery
      <ChevronsUpDownIcon {...args} />
    </span>
  {/snippet}
</Story>
