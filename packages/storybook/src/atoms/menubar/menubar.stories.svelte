<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Menubar from '@cio/ui/base/menubar';

  const { Story } = defineMeta({
    title: 'Atom/Menubar',
    component: Menubar.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Menubar.Root>
      <Menubar.Menu>
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>
            New Tab <span class="ml-auto text-xs">⌘T</span>
          </Menubar.Item>
          <Menubar.Item>
            New Window <span class="ml-auto text-xs">⌘N</span>
          </Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item>Share</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item>Print</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>
            Undo <span class="ml-auto text-xs">⌘Z</span>
          </Menubar.Item>
          <Menubar.Item>
            Redo <span class="ml-auto text-xs">⇧⌘Z</span>
          </Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item>Cut</Menubar.Item>
          <Menubar.Item>Copy</Menubar.Item>
          <Menubar.Item>Paste</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>View</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.CheckboxItem checked={true}>Always Show Bookmarks Bar</Menubar.CheckboxItem>
          <Menubar.CheckboxItem>Always Show Full URLs</Menubar.CheckboxItem>
          <Menubar.Separator />
          <Menubar.Item>Reload <span class="ml-auto text-xs">⌘R</span></Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar.Root>
  {/snippet}
</Story>
