<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Label } from '@cio/ui/base/label';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Checkbox',
    component: Checkbox,
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
    <Checkbox />
  {/snippet}
</Story>

<Story name="With Label">
  {#snippet template()}
    <div class="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label for="terms">Accept terms and conditions</Label>
    </div>
  {/snippet}
</Story>

<Story name="Checked">
  {#snippet template()}
    <div class="flex items-center space-x-2">
      <Checkbox checked={true} />
      <Label>Checked by default</Label>
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <div class="flex items-center space-x-2">
        <Checkbox disabled />
        <Label>Disabled unchecked</Label>
      </div>
      <div class="flex items-center space-x-2">
        <Checkbox disabled checked={true} />
        <Label>Disabled checked</Label>
      </div>
    </div>
  {/snippet}
</Story>
