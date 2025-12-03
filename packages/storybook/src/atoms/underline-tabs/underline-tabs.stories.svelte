<script module>
  import { UnderlineTabs } from '@cio/ui';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/UnderlineTabs',
    component: UnderlineTabs.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      value: {
        control: 'text',
        description: 'The value of the currently selected tab',
        table: { defaultValue: { summary: 'undefined' } }
      },
      onValueChange: {
        control: false,
        description: 'Callback function called when the selected tab changes',
        table: {
          type: { summary: '(value: string) => void' },
          defaultValue: { summary: 'undefined' }
        }
      },
      loop: {
        control: 'boolean',
        description: 'Whether tab navigation should loop',
        table: { defaultValue: { summary: 'true' } }
      },
      disabled: {
        control: 'boolean',
        description: 'Whether the tabs are disabled',
        table: { defaultValue: { summary: 'false' } }
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <div class="ui:w-[400px]">
      <UnderlineTabs.Root {...args} value="home">
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger value="home">Home</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="profile">Profile</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="settings">Settings</UnderlineTabs.Trigger>
        </UnderlineTabs.List>
        <UnderlineTabs.Content value="home">
          <div class="ui:py-4">
            <h3 class="ui:mb-2 ui:text-lg ui:font-semibold">Home Content</h3>
            <p class="ui:text-muted-foreground ui:text-sm">
              Welcome to the home tab. This is where your main content lives.
            </p>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="profile">
          <div class="ui:py-4">
            <h3 class="ui:mb-2 ui:text-lg ui:font-semibold">Profile Content</h3>
            <p class="ui:text-muted-foreground ui:text-sm">
              Manage your profile settings and personal information here.
            </p>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="settings">
          <div class="ui:py-4">
            <h3 class="ui:mb-2 ui:text-lg ui:font-semibold">Settings Content</h3>
            <p class="ui:text-muted-foreground ui:text-sm">Configure your application settings and preferences.</p>
          </div>
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    </div>
  {/snippet}
</Story>

<Story name="Disabled Tab">
  {#snippet template(args)}
    <div class="w-[400px]">
      <UnderlineTabs.Root {...args} value="home">
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger value="home">Home</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="profile">Profile</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="settings" disabled>Settings</UnderlineTabs.Trigger>
        </UnderlineTabs.List>
        <UnderlineTabs.Content value="home">
          <div class="py-4">
            <p class="text-muted-foreground text-sm">Home content is shown here.</p>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="profile">
          <div class="py-4">
            <p class="text-muted-foreground text-sm">Profile content is shown here.</p>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="settings">
          <div class="py-4">
            <p class="text-muted-foreground text-sm">Settings content (disabled).</p>
          </div>
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    </div>
  {/snippet}
</Story>
