<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Item from '@cio/ui/base/item';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import * as InputGroup from '@cio/ui/base/input-group';
  import * as Empty from '@cio/ui/base/empty';
  import { Progress } from '@cio/ui/base/progress';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';

  const { Story } = defineMeta({
    title: 'Atom/Spinner',
    component: Spinner,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Spinner />
  {/snippet}
</Story>

<Story name="Size">
  {#snippet template()}
    <div class="flex items-center gap-6">
      <Spinner class="size-3" />
      <Spinner class="size-4" />
      <Spinner class="size-6" />
      <Spinner class="size-8" />
    </div>
  {/snippet}
</Story>

<Story name="Color">
  {#snippet template()}
    <div class="flex items-center gap-6">
      <Spinner class="size-6 text-red-500" />
      <Spinner class="size-6 text-green-500" />
      <Spinner class="size-6 text-blue-500" />
      <Spinner class="size-6 text-yellow-500" />
      <Spinner class="size-6 text-purple-500" />
    </div>
  {/snippet}
</Story>

<Story name="Button">
  {#snippet template()}
    <div class="flex flex-col items-center gap-4">
      <Button disabled size="sm">
        <Spinner />
        Loading...
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner />
        Please wait
      </Button>
      <Button variant="secondary" disabled size="sm">
        <Spinner />
        Processing
      </Button>
    </div>
  {/snippet}
</Story>

<Story name="Badge">
  {#snippet template()}
    <div class="flex items-center gap-4 [--radius:1.2rem]">
      <Badge>
        <Spinner />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner />
        Processing
      </Badge>
    </div>
  {/snippet}
</Story>

<Story name="Input Group">
  {#snippet template()}
    <div class="flex w-full max-w-md flex-col gap-4">
      <InputGroup.Root>
        <InputGroup.Input placeholder="Send a message..." disabled />
        <InputGroup.Addon align="inline-end">
          <Spinner />
        </InputGroup.Addon>
      </InputGroup.Root>
      <InputGroup.Root>
        <InputGroup.Textarea placeholder="Send a message..." disabled />
        <InputGroup.Addon align="block-end">
          <Spinner />
          Validating...
          <InputGroup.Button class="ms-auto" variant="default">
            <ArrowUpIcon />
            <span class="sr-only">Send</span>
          </InputGroup.Button>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  {/snippet}
</Story>

<Story name="Empty">
  {#snippet template()}
    <Empty.Root class="w-full">
      <Empty.Header>
        <Empty.Media variant="icon">
          <Spinner />
        </Empty.Media>
        <Empty.Title>Processing your request</Empty.Title>
        <Empty.Description>Please wait while we process your request. Do not refresh the page.</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" size="sm">Cancel</Button>
      </Empty.Content>
    </Empty.Root>
  {/snippet}
</Story>

<Story name="Item">
  {#snippet template()}
    <div class="flex w-full max-w-md flex-col gap-4 [--radius:1rem]">
      <Item.Root variant="outline">
        <Item.Media variant="icon">
          <Spinner />
        </Item.Media>
        <Item.Content>
          <Item.Title>Downloading...</Item.Title>
          <Item.Description>129 MB / 1000 MB</Item.Description>
        </Item.Content>
        <Item.Actions class="hidden sm:flex">
          <Button variant="outline" size="sm">Cancel</Button>
        </Item.Actions>
        <Item.Footer>
          <Progress value={75} />
        </Item.Footer>
      </Item.Root>
    </div>
  {/snippet}
</Story>

<Story name="Item with Payment">
  {#snippet template()}
    <div class="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
      <Item.Root variant="muted">
        <Item.Media>
          <Spinner />
        </Item.Media>
        <Item.Content>
          <Item.Title class="line-clamp-1">Processing payment...</Item.Title>
        </Item.Content>
        <Item.Content class="flex-none justify-end">
          <span class="text-sm tabular-nums">$100.00</span>
        </Item.Content>
      </Item.Root>
    </div>
  {/snippet}
</Story>
