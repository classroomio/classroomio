<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from '@cio/ui/base/button';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Button',
    component: Button,
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
  {#snippet template()}
    <Button>Default Button</Button>
  {/snippet}
</Story>

<Story name="Secondary">
  {#snippet template(args)}
    <Button {...args} variant="secondary">Secondary Button</Button>
  {/snippet}
</Story>

<Story name="Destructive">
  {#snippet template(args)}
    <Button {...args} variant="destructive">Destructive Button</Button>
  {/snippet}
</Story>

<Story name="Outline">
  {#snippet template(args)}
    <Button {...args} variant="outline">Outline Button</Button>
  {/snippet}
</Story>

<Story name="Ghost">
  {#snippet template(args)}
    <Button {...args} variant="ghost">Ghost Button</Button>
  {/snippet}
</Story>

<Story name="Link">
  {#snippet template(args)}
    <Button {...args} variant="link">Link Button</Button>
  {/snippet}
</Story>

<Story name="Small">
  {#snippet template(args)}
    <Button {...args} size="sm">Small Button</Button>
  {/snippet}
</Story>

<Story name="Large">
  {#snippet template(args)}
    <Button {...args} size="lg">Large Button</Button>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template(args)}
    <Button {...args} disabled>Disabled Button</Button>
  {/snippet}
</Story>

<Story name="As Link">
  {#snippet template(args)}
    <Button {...args} href="#">Link Button</Button>
  {/snippet}
</Story>

<Story name="All Variants">
  {#snippet template()}
    <div class="flex flex-wrap gap-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  {/snippet}
</Story>

<Story name="All Sizes">
  {#snippet template()}
    <div class="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
  {/snippet}
</Story>
