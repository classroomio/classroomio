<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Select from '@cio/ui/base/select';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Select',
    component: Select.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      value: {
        control: 'text',
        description: 'The controlled value of the select'
      },
      onValueChange: {
        control: false,
        description: 'Callback function when the value changes'
      },
      disabled: {
        control: 'boolean',
        description: 'Whether the select is disabled'
      },
      type: {
        control: 'select',
        options: ['single', 'multiple'],
        description: 'Whether the select allows single or multiple selection'
      },
      open: {
        control: 'boolean',
        description: 'The controlled open state of the select'
      },
      name: {
        control: 'text',
        description: 'The name attribute for the hidden input'
      },
      required: {
        control: 'boolean',
        description: 'Whether the select is required for form validation'
      },
      autocomplete: {
        control: 'text',
        description: 'The autocomplete attribute for the hidden input'
      },
      allowDeselect: {
        control: 'boolean',
        description: 'Whether to allow deselecting the selected value'
      }
    },
    tags: ['autodocs']
  });

  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'grapes', label: 'Grapes' },
    { value: 'pineapple', label: 'Pineapple' }
  ];

  let value = $state('');

  const triggerContent = $derived(fruits.find((f) => f.value === value)?.label ?? 'Select a fruit');
</script>

<Story name="Default">
  {#snippet template()}
    <Select.Root type="single" name="favoriteFruit" bind:value>
      <Select.Trigger class="w-[180px]">
        {triggerContent}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Fruits</Select.Label>
          {#each fruits as fruit (fruit.value)}
            <Select.Item value={fruit.value} label={fruit.label} disabled={fruit.value === 'grapes'}>
              {fruit.label}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  {/snippet}
</Story>
