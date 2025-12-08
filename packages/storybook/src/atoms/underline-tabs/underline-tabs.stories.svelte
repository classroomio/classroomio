<script module>
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
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
    <div class="w-lg">
      <UnderlineTabs.Root {...args} value="note">
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger value="note">Note</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="slides">Slides</UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger value="video">Video</UnderlineTabs.Trigger>
        </UnderlineTabs.List>
        <UnderlineTabs.Content value="note">
          <div class="ui:py-4">
            <h3 class="ui:mb-2 ui:text-lg ui:font-semibold">Note Content</h3>
            <p class="ui:text-muted-foreground ui:text-sm">
              Welcome to the note tab. This is where your note content lives.
            </p>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="slides">
          <div class="ui:py-4">
            <h3 class="ui:mb-2 ui:text-lg ui:font-semibold">Slides Content</h3>
            <p class="ui:text-muted-foreground ui:text-sm">Manage your slides content and personal information here.</p>
          </div>
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="video">
          <div class="ui:py-4">
            <h3 class="ui:mb-2 ui:text-lg ui:font-semibold">Video Content</h3>
            <p class="ui:text-muted-foreground ui:text-sm">Configure your video content and preferences.</p>
          </div>
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    </div>
  {/snippet}
</Story>

<Story name="Disabled Tab">
  {#snippet template(args)}
    <div class="w-lg">
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
