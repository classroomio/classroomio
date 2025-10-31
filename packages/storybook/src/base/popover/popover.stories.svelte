<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Popover, Button, Input, Label } from '@cio/ui';

  const { Story } = defineMeta({
    title: 'Base/Popover',
    component: Popover.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Popover.Root>
      <Popover.Trigger>
        <Button.Root variant="outline">Open popover</Button.Root>
      </Popover.Trigger>
      <Popover.Content class="w-80">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Dimensions</h4>
            <p class="text-muted-foreground text-sm">Set the dimensions for the layer.</p>
          </div>
          <div class="grid gap-2">
            <div class="grid grid-cols-3 items-center gap-4">
              <Label.Root for="width">Width</Label.Root>
              <Input.Root id="width" value="100%" class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label.Root for="maxWidth">Max. width</Label.Root>
              <Input.Root id="maxWidth" value="300px" class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label.Root for="height">Height</Label.Root>
              <Input.Root id="height" value="25px" class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label.Root for="maxHeight">Max. height</Label.Root>
              <Input.Root id="maxHeight" value="none" class="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  {/snippet}
</Story>

<Story name="Simple">
  {#snippet template()}
    <Popover.Root>
      <Popover.Trigger>
        <Button.Root>Click me</Button.Root>
      </Popover.Trigger>
      <Popover.Content>
        <p class="text-sm">This is a simple popover with some text content.</p>
      </Popover.Content>
    </Popover.Root>
  {/snippet}
</Story>

<Story name="With Form">
  {#snippet template()}
    <Popover.Root>
      <Popover.Trigger>
        <Button.Root variant="outline">Settings</Button.Root>
      </Popover.Trigger>
      <Popover.Content class="w-80">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Settings</h4>
            <p class="text-muted-foreground text-sm">Manage your account settings.</p>
          </div>
          <div class="grid gap-2">
            <div class="grid gap-1">
              <Label.Root for="name">Display name</Label.Root>
              <Input.Root id="name" value="Pedro Duarte" />
            </div>
            <div class="grid gap-1">
              <Label.Root for="username">Username</Label.Root>
              <Input.Root id="username" value="@peduarte" />
            </div>
          </div>
          <Button.Root size="sm" class="w-full">Save changes</Button.Root>
        </div>
      </Popover.Content>
    </Popover.Root>
  {/snippet}
</Story>

<Story name="Information">
  {#snippet template()}
    <Popover.Root>
      <Popover.Trigger>
        <Button.Root variant="ghost" size="sm">ℹ️ Info</Button.Root>
      </Popover.Trigger>
      <Popover.Content class="w-56">
        <div class="space-y-2">
          <h4 class="font-medium">About this feature</h4>
          <p class="text-muted-foreground text-sm">
            This feature allows you to quickly access important information without leaving the current page.
          </p>
        </div>
      </Popover.Content>
    </Popover.Root>
  {/snippet}
</Story>
