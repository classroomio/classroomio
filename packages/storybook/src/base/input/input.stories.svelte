<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Input } from '@cio/ui/base/input';
  import { Label } from '@cio/ui/base/label';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Base/Input',
    component: Input,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default" args={{ placeholder: 'Enter text...' }} />

<Story name="With Label">
  {#snippet template()}
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  {/snippet}
</Story>

<Story name="Password">
  {#snippet template()}
    <Input type="password" placeholder="Password" />
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <Input disabled placeholder="Disabled input" />
  {/snippet}
</Story>

<Story name="With Error">
  {#snippet template()}
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email-error">Email</Label>
      <Input type="email" id="email-error" placeholder="Email" class="border-red-500" />
      <p class="text-sm text-red-500">This field is required</p>
    </div>
  {/snippet}
</Story>

<Story name="File Input">
  {#snippet template()}
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  {/snippet}
</Story>

<Story name="Search">
  {#snippet template()}
    <Input type="search" placeholder="Search..." />
  {/snippet}
</Story>
