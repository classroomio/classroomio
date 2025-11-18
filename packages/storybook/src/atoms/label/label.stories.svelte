<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Label } from '@cio/ui/base/label';
  import { Input } from '@cio/ui/base/input';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Label',
    component: Label,
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
    <Label>Email</Label>
  {/snippet}
</Story>

<Story name="With Input">
  {#snippet template()}
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  {/snippet}
</Story>

<Story name="Required">
  {#snippet template()}
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="username">
        Username
        <span class="text-red-500">*</span>
      </Label>
      <Input id="username" placeholder="Username" required />
    </div>
  {/snippet}
</Story>
