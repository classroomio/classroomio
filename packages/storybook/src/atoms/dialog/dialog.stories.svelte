<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Dialog, Button, Input, Label } from '@cio/ui';

  const { Story } = defineMeta({
    title: 'Atom/Dialog',
    component: Dialog.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Dialog.Root>
      <Dialog.DialogTrigger>
        <Button.Root>Open Dialog</Button.Root>
      </Dialog.DialogTrigger>
      <Dialog.DialogContent>
        <Dialog.DialogHeader>
          <Dialog.DialogTitle>Dialog Title</Dialog.DialogTitle>
          <Dialog.DialogDescription>This is a description of what the dialog is for.</Dialog.DialogDescription>
        </Dialog.DialogHeader>
        <div class="py-4">
          <p>Dialog content goes here.</p>
        </div>
      </Dialog.DialogContent>
    </Dialog.Root>
  {/snippet}
</Story>

<Story name="With Form">
  {#snippet template()}
    <Dialog.Root>
      <Dialog.DialogTrigger>
        <Button.Root>Edit Profile</Button.Root>
      </Dialog.DialogTrigger>
      <Dialog.DialogContent>
        <Dialog.DialogHeader>
          <Dialog.DialogTitle>Edit profile</Dialog.DialogTitle>
          <Dialog.DialogDescription
            >Make changes to your profile here. Click save when you're done.</Dialog.DialogDescription
          >
        </Dialog.DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label.Root for="name" class="text-right">Name</Label.Root>
            <Input.Root id="name" value="John Doe" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label.Root for="username" class="text-right">Username</Label.Root>
            <Input.Root id="username" value="@johndoe" class="col-span-3" />
          </div>
        </div>
        <Dialog.DialogFooter>
          <Button.Root type="submit">Save changes</Button.Root>
        </Dialog.DialogFooter>
      </Dialog.DialogContent>
    </Dialog.Root>
  {/snippet}
</Story>
