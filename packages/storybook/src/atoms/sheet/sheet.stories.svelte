<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Sheet, Button, Input, Label } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Sheet',
    component: Sheet.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      open: {
        control: 'boolean',
        description: 'The controlled open state of the sheet'
      },
      onOpenChange: {
        control: false,
        description: 'Callback function when the open state changes'
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Right">
  {#snippet template()}
    <Sheet.Root>
      <Sheet.SheetTrigger>
        <Button.Root variant="outline">Open Sheet</Button.Root>
      </Sheet.SheetTrigger>
      <Sheet.SheetContent>
        <Sheet.SheetHeader>
          <Sheet.SheetTitle>Edit profile</Sheet.SheetTitle>
          <Sheet.SheetDescription
            >Make changes to your profile here. Click save when you're done.</Sheet.SheetDescription
          >
        </Sheet.SheetHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label.Root for="name" class="text-right">Name</Label.Root>
            <Input.Root id="name" value="Pedro Duarte" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label.Root for="username" class="text-right">Username</Label.Root>
            <Input.Root id="username" value="@peduarte" class="col-span-3" />
          </div>
        </div>
        <Sheet.SheetFooter>
          <Sheet.SheetClose>
            <Button.Root type="submit">Save changes</Button.Root>
          </Sheet.SheetClose>
        </Sheet.SheetFooter>
      </Sheet.SheetContent>
    </Sheet.Root>
  {/snippet}
</Story>

<Story name="Left">
  {#snippet template()}
    <Sheet.Root>
      <Sheet.SheetTrigger>
        <Button.Root>Open Left Sheet</Button.Root>
      </Sheet.SheetTrigger>
      <Sheet.SheetContent side="left">
        <Sheet.SheetHeader>
          <Sheet.SheetTitle>Left Sheet</Sheet.SheetTitle>
          <Sheet.SheetDescription>This sheet opens from the left side.</Sheet.SheetDescription>
        </Sheet.SheetHeader>
      </Sheet.SheetContent>
    </Sheet.Root>
  {/snippet}
</Story>

<Story name="Top">
  {#snippet template()}
    <Sheet.Root>
      <Sheet.SheetTrigger>
        <Button.Root>Open Top Sheet</Button.Root>
      </Sheet.SheetTrigger>
      <Sheet.SheetContent side="top">
        <Sheet.SheetHeader>
          <Sheet.SheetTitle>Top Sheet</Sheet.SheetTitle>
          <Sheet.SheetDescription>This sheet opens from the top.</Sheet.SheetDescription>
        </Sheet.SheetHeader>
      </Sheet.SheetContent>
    </Sheet.Root>
  {/snippet}
</Story>

<Story name="Bottom">
  {#snippet template()}
    <Sheet.Root>
      <Sheet.SheetTrigger>
        <Button.Root>Open Bottom Sheet</Button.Root>
      </Sheet.SheetTrigger>
      <Sheet.SheetContent side="bottom">
        <Sheet.SheetHeader>
          <Sheet.SheetTitle>Bottom Sheet</Sheet.SheetTitle>
          <Sheet.SheetDescription>This sheet opens from the bottom.</Sheet.SheetDescription>
        </Sheet.SheetHeader>
      </Sheet.SheetContent>
    </Sheet.Root>
  {/snippet}
</Story>
