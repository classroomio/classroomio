<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Badge } from '@cio/ui/base/badge';

  const { Story } = defineMeta({
    title: 'Atom/Badge',
    component: Badge,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Badge>Default Badge</Badge>
  {/snippet}
</Story>

<Story name="Secondary">
  {#snippet template()}
    <Badge variant="secondary">Secondary</Badge>
  {/snippet}
</Story>

<Story name="Destructive">
  {#snippet template()}
    <Badge variant="destructive">Destructive</Badge>
  {/snippet}
</Story>

<Story name="Outline">
  {#snippet template()}
    <Badge variant="outline">Outline</Badge>
  {/snippet}
</Story>

<Story name="Multiple Badges">
  {#snippet template()}
    <div class="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  {/snippet}
</Story>
