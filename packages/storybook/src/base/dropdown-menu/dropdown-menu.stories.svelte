<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DropdownMenu, Button } from '@cio/ui';

  const { Story } = defineMeta({
    title: 'Base/DropdownMenu',
    component: DropdownMenu.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button.Root variant="outline">Open</Button.Root>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          <DropdownMenu.Label>My Account</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>Profile</DropdownMenu.Item>
          <DropdownMenu.Item>Billing</DropdownMenu.Item>
          <DropdownMenu.Item>Settings</DropdownMenu.Item>
          <DropdownMenu.Item>Keyboard shortcuts</DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item>Team</DropdownMenu.Item>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>Invite users</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <DropdownMenu.Item>Email</DropdownMenu.Item>
              <DropdownMenu.Item>Message</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>More...</DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          <DropdownMenu.Item>New Team</DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>GitHub</DropdownMenu.Item>
        <DropdownMenu.Item>Support</DropdownMenu.Item>
        <DropdownMenu.Item disabled>API</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Log out</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/snippet}
</Story>

<Story name="With Icons">
  {#snippet template()}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button.Root variant="outline">Open</Button.Root>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          <span>👤 Profile</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <span>💳 Billing</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <span>⚙️ Settings</span>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>
          <span>🚪 Logout</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/snippet}
</Story>

<Story name="Simple Menu">
  {#snippet template()}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button.Root variant="outline">Open</Button.Root>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>Edit</DropdownMenu.Item>
        <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Item>Archive</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="text-red-600">Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/snippet}
</Story>

<Story name="With Checkboxes">
  {#snippet template()}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button.Root variant="outline">Open</Button.Root>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>View Options</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.CheckboxItem checked>Status Bar</DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem>Activity Bar</DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem checked>Panel</DropdownMenu.CheckboxItem>
        <DropdownMenu.Separator />
        <DropdownMenu.RadioGroup value="single">
          <DropdownMenu.RadioItem value="single">Single</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="group">Group</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/snippet}
</Story>
