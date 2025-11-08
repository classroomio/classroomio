<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Tooltip, Provider, Trigger, Content } from '@cio/ui/base/tooltip';
  import { Button } from '@cio/ui/base/button';
  // import { Arro}

  const { Story } = defineMeta({
    title: 'Atom/Tooltip',
    component: Provider,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Provider>
      <Tooltip>
        <Trigger>
          <Button variant="outline">Hover me</Button>
        </Trigger>
        <Content>
          <p>Add to library</p>
        </Content>
      </Tooltip>
    </Provider>
  {/snippet}
</Story>

<Story name="With Arrow">
  {#snippet template()}
    <Provider>
      <Tooltip>
        <Trigger>
          <Button>Hover for tooltip</Button>
        </Trigger>
        <Content>
          <p>This tooltip has an arrow pointing to the trigger</p>
          <!-- <Arrow /> -->
          =>
        </Content>
      </Tooltip>
    </Provider>
  {/snippet}
</Story>

<Story name="Simple Text">
  {#snippet template()}
    <Provider>
      <Tooltip>
        <Trigger>
          <Button variant="ghost" size="sm">❓</Button>
        </Trigger>
        <Content>
          <p>Help information</p>
        </Content>
      </Tooltip>
    </Provider>
  {/snippet}
</Story>

<Story name="Multiple Tooltips">
  {#snippet template()}
    <Provider>
      <div class="flex gap-4">
        <Tooltip>
          <Trigger>
            <Button variant="outline">Save</Button>
          </Trigger>
          <Content>
            <p>Save your work (Ctrl+S)</p>
          </Content>
        </Tooltip>

        <Tooltip>
          <Trigger>
            <Button variant="outline">Edit</Button>
          </Trigger>
          <Content>
            <p>Edit this item</p>
          </Content>
        </Tooltip>

        <Tooltip>
          <Trigger>
            <Button variant="destructive">Delete</Button>
          </Trigger>
          <Content>
            <p>Permanently delete this item</p>
          </Content>
        </Tooltip>
      </div>
    </Provider>
  {/snippet}
</Story>

<Story name="Icon Button">
  {#snippet template()}
    <Provider>
      <Tooltip>
        <Trigger>
          <Button variant="ghost" size="sm">🔧</Button>
        </Trigger>
        <Content>
          <p>Settings</p>
        </Content>
      </Tooltip>
    </Provider>
  {/snippet}
</Story>

<Story name="Long Content">
  {#snippet template()}
    <Provider>
      <Tooltip>
        <Trigger>
          <Button variant="outline">Info</Button>
        </Trigger>
        <Content class="max-w-xs">
          <p>
            This is a longer tooltip with more detailed information that might span multiple lines to provide
            comprehensive context about the feature or action.
          </p>
        </Content>
      </Tooltip>
    </Provider>
  {/snippet}
</Story>
