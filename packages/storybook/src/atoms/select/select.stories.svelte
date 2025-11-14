<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Select from '@cio/ui/base/select';

  const { Story } = defineMeta({
    title: 'Atom/Select',
    component: Select.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Select.Root type="single">
      <Select.Trigger class="w-[180px]">
        <Select.Label placeholder="Select a fruit" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="apple">Apple</Select.Item>
        <Select.Item value="banana">Banana</Select.Item>
        <Select.Item value="orange">Orange</Select.Item>
        <Select.Item value="grape">Grape</Select.Item>
        <Select.Item value="mango">Mango</Select.Item>
      </Select.Content>
    </Select.Root>
  {/snippet}
</Story>

<Story name="With Groups">
  {#snippet template()}
    <Select.Root type="single">
      <Select.Trigger class="w-[180px]">
        <Select.Label placeholder="Select a timezone" />
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>North America</Select.Label>
          <Select.Item value="est">Eastern Standard Time (EST)</Select.Item>
          <Select.Item value="cst">Central Standard Time (CST)</Select.Item>
          <Select.Item value="mst">Mountain Standard Time (MST)</Select.Item>
          <Select.Item value="pst">Pacific Standard Time (PST)</Select.Item>
        </Select.Group>
        <Select.Separator />
        <Select.Group>
          <Select.Label>Europe</Select.Label>
          <Select.Item value="gmt">Greenwich Mean Time (GMT)</Select.Item>
          <Select.Item value="cet">Central European Time (CET)</Select.Item>
        </Select.Group>
      </Select.Content>
    </Select.Root>
  {/snippet}
</Story>

<Story name="Controlled">
  {#snippet template()}
    <div class="space-y-4">
      <Select.Root type="single" value="apple" onValueChange={(v) => console.log('Selected:', v)}>
        <Select.Trigger class="w-[180px]">
          <Select.Label placeholder="Select a fruit" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
          <Select.Item value="orange">Orange</Select.Item>
        </Select.Content>
      </Select.Root>
      <p class="text-muted-foreground text-sm">Check console for selected value</p>
    </div>
  {/snippet}
</Story>
