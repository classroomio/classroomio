<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Label } from '@cio/ui/base/label';

  const { Story } = defineMeta({
    title: 'Atom/RadioGroup',
    component: RadioGroup.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <RadioGroup.Root value="option-1">
      <div class="flex items-center space-x-2">
        <RadioGroup.Item value="option-1" id="option-1" />
        <Label for="option-1">Option 1</Label>
      </div>
      <div class="flex items-center space-x-2">
        <RadioGroup.Item value="option-2" id="option-2" />
        <Label for="option-2">Option 2</Label>
      </div>
      <div class="flex items-center space-x-2">
        <RadioGroup.Item value="option-3" id="option-3" />
        <Label for="option-3">Option 3</Label>
      </div>
    </RadioGroup.Root>
  {/snippet}
</Story>

<Story name="With Descriptions">
  {#snippet template()}
    <RadioGroup.Root value="comfortable" class="space-y-4">
      <div class="flex items-start space-x-2">
        <RadioGroup.Item value="default" id="r1" class="mt-1" />
        <div>
          <Label for="r1" class="font-medium">Default</Label>
          <p class="text-muted-foreground text-sm">The standard spacing for your app</p>
        </div>
      </div>
      <div class="flex items-start space-x-2">
        <RadioGroup.Item value="comfortable" id="r2" class="mt-1" />
        <div>
          <Label for="r2" class="font-medium">Comfortable</Label>
          <p class="text-muted-foreground text-sm">More space for easier interaction</p>
        </div>
      </div>
      <div class="flex items-start space-x-2">
        <RadioGroup.Item value="compact" id="r3" class="mt-1" />
        <div>
          <Label for="r3" class="font-medium">Compact</Label>
          <p class="text-muted-foreground text-sm">Less space, more content</p>
        </div>
      </div>
    </RadioGroup.Root>
  {/snippet}
</Story>
