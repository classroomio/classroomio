<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import type { ComponentProps } from 'svelte';
  import { cn } from '../../tools';

  interface Props {
    placeholder?: string;
    value?: string;
    class?: string;
    disabled?: boolean;
    prefix?: string;
    suffix?: string;
  }

  let {
    placeholder = 'example.com',
    value = $bindable(''),
    class: className = '',
    disabled = false,
    prefix = 'https://',
    suffix = '.com',
    ...restProps
  }: Props & Omit<ComponentProps<typeof InputGroup.Root>, 'class' | 'children'> = $props();
</script>

<InputGroup.Root class={cn('w-full', className)} data-slot="domain-input">
  <InputGroup.Addon>
    <InputGroup.Text>{prefix}</InputGroup.Text>
  </InputGroup.Addon>
  <InputGroup.Input {...restProps} {placeholder} bind:value {disabled} class="!ps-0.5" />
  <InputGroup.Addon align="inline-end">
    <InputGroup.Text>{suffix}</InputGroup.Text>
  </InputGroup.Addon>
</InputGroup.Root>
