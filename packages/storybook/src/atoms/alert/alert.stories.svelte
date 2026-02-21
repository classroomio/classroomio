<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Alert from '@cio/ui/base/alert';
  import { Button } from '@cio/ui/base/button';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  const { Story } = defineMeta({
    title: 'Atom/Alert',
    component: Alert.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Alert.Callout
      variant="default"
      title="Heads up!"
      description="You can add components to your app using the cli."
    />
  {/snippet}
</Story>

<Story name="Information">
  {#snippet template()}
    <Alert.Callout
      variant="information"
      title="Note"
      description="Here’s some helpful information you might want to know."
    />
  {/snippet}
</Story>

<Story name="Destructive">
  {#snippet template()}
    <Alert.Callout variant="destructive" title="Error" description="Your session has expired. Please log in again." />
  {/snippet}
</Story>

<Story name="Warning">
  {#snippet template()}
    <Alert.Callout
      variant="warning"
      title="Warning"
      description="This action may have unintended consequences. Please review before continuing."
    />
  {/snippet}
</Story>

<Story name="Custom composition">
  {#snippet template()}
    <Alert.Root variant="default" class="max-w-md">
      <SparklesIcon />
      <Alert.Title>Custom alert</Alert.Title>
      <Alert.Description>
        For full control you can compose Alert.Root, Alert.Title, and Alert.Description with any icon or extra content
        (e.g. buttons or links).
      </Alert.Description>
      <div class="col-start-2 mt-2 flex gap-2">
        <Button variant="outline" size="sm">Dismiss</Button>
        <Button size="sm">Learn more</Button>
      </div>
    </Alert.Root>
  {/snippet}
</Story>
