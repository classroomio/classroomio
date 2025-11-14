<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Separator } from '@cio/ui/base/separator';

  const { Story } = defineMeta({
    title: 'Atom/Separator',
    component: Separator,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Horizontal">
  {#snippet template()}
    <div class="w-96 space-y-4">
      <div>
        <h4 class="text-sm font-medium">Section 1</h4>
        <p class="text-muted-foreground text-sm">Content for the first section</p>
      </div>
      <Separator />
      <div>
        <h4 class="text-sm font-medium">Section 2</h4>
        <p class="text-muted-foreground text-sm">Content for the second section</p>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Vertical">
  {#snippet template()}
    <div class="flex h-20 items-center space-x-4">
      <div class="space-y-1">
        <h4 class="text-sm font-medium">Item 1</h4>
      </div>
      <Separator orientation="vertical" />
      <div class="space-y-1">
        <h4 class="text-sm font-medium">Item 2</h4>
      </div>
      <Separator orientation="vertical" />
      <div class="space-y-1">
        <h4 class="text-sm font-medium">Item 3</h4>
      </div>
    </div>
  {/snippet}
</Story>
