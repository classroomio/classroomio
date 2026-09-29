<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from '@cio/ui/base/button';
  import { HoverableItem, MaximizeIcon } from '@cio/ui/custom/moving-icons';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Maximize',
    component: MaximizeIcon,
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
    <MaximizeIcon {...args} />
  {/snippet}
</Story>

<Story name="Animated" args={{ size: 24, animate: true }}>
  {#snippet template(args)}
    <MaximizeIcon {...args} />
  {/snippet}
</Story>

<Story name="In Expand Button">
  {#snippet template()}
    <HoverableItem>
      {#snippet children(isHovered)}
        <Button type="button" variant="outline" size="sm">
          <MaximizeIcon {isHovered} size={16} ariaHidden />
          Expand
        </Button>
      {/snippet}
    </HoverableItem>
  {/snippet}
</Story>
