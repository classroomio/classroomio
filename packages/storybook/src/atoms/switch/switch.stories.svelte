<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';

  const { Story } = defineMeta({
    title: 'Atom/Switch',
    component: Switch,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Switch id="airplane-mode" />
  {/snippet}
</Story>

<Story name="With Label">
  {#snippet template()}
    <div class="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label for="airplane-mode">Airplane Mode</Label>
    </div>
  {/snippet}
</Story>
