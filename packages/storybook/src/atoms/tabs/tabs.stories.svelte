<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Tabs from '@cio/ui/base/tabs';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Tabs',
    component: Tabs.Root,
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
    <Tabs.Root value="overview" class="w-[500px]">
      <Tabs.List class="grid w-full grid-cols-3">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
        <Tabs.Trigger value="reports">Reports</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">
        <div class="space-y-4 pt-4">
          <p class="text-muted-foreground text-sm">View your overview dashboard with key metrics and insights.</p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="analytics">
        <div class="space-y-4 pt-4">
          <p class="text-muted-foreground text-sm">Deep dive into your analytics and user behavior patterns.</p>
        </div>
      </Tabs.Content>
      <Tabs.Content value="reports">
        <div class="space-y-4 pt-4">
          <p class="text-muted-foreground text-sm">Generate and download detailed reports for your records.</p>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  {/snippet}
</Story>
