<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PackageCheckIcon } from '@cio/ui/custom/moving-icons';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/PackageCheck',
    component: PackageCheckIcon,
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
    <PackageCheckIcon {...args} />
  {/snippet}
</Story>

<Story name="Hovered" args={{ size: 24, isHovered: true }}>
  {#snippet template(args)}
    <PackageCheckIcon {...args} />
  {/snippet}
</Story>

<Story name="In Navigation">
  {#snippet template()}
    <span class="inline-flex items-center gap-2 text-sm font-medium">
      <PackageCheckIcon size={16} />
      Single-activity course
    </span>
  {/snippet}
</Story>
