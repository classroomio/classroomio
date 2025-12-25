<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Command } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Command',
    component: Command.Root,
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
    <Command.Root class="rounded-lg border shadow-md">
      <Command.CommandInput placeholder="Type a command or search..." />
      <Command.CommandList>
        <Command.CommandEmpty>No results found.</Command.CommandEmpty>
        <Command.CommandGroup heading="Suggestions">
          <Command.CommandItem>
            <span>Calendar</span>
          </Command.CommandItem>
          <Command.CommandItem>
            <span>Search Emoji</span>
          </Command.CommandItem>
          <Command.CommandItem>
            <span>Calculator</span>
          </Command.CommandItem>
        </Command.CommandGroup>
        <Command.CommandSeparator />
        <Command.CommandGroup heading="Settings">
          <Command.CommandItem>
            <span>Profile</span>
            <Command.CommandShortcut>⌘P</Command.CommandShortcut>
          </Command.CommandItem>
          <Command.CommandItem>
            <span>Billing</span>
            <Command.CommandShortcut>⌘B</Command.CommandShortcut>
          </Command.CommandItem>
          <Command.CommandItem>
            <span>Settings</span>
            <Command.CommandShortcut>⌘S</Command.CommandShortcut>
          </Command.CommandItem>
        </Command.CommandGroup>
      </Command.CommandList>
    </Command.Root>
  {/snippet}
</Story>
