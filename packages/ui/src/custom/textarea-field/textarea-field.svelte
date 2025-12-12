<script lang="ts">
  import * as Field from '../../base/field';
  import { Textarea } from '../../base/textarea';
  import { cn } from '../../tools';
  import type { ComponentProps } from 'svelte';

  interface Props extends Omit<ComponentProps<typeof Textarea>, 'class'> {
    label?: string;
    labelClassName?: string;
    helperMessage?: string;
    errorMessage?: string;
    isRequired?: boolean;
    className?: string;
    bgColor?: string;
    isAIEnabled?: boolean;
    initAIPrompt?: string;
    aiAlignPopover?: string;
    iconbutton?: import('svelte').Snippet;
  }

  let {
    label = '',
    labelClassName = '',
    helperMessage = '',
    errorMessage = '',
    isRequired = false,
    className = '',
    bgColor = '',
    iconbutton,
    value = $bindable(),
    ...textareaProps
  }: Props = $props();
</script>

<Field.Field class={className}>
  {#if label}
    <Field.Label class={labelClassName}>
      {label}
      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </Field.Label>
  {/if}

  <Textarea
    bind:value
    class={cn(
      'ui:border-b-2 ui:border-l-0 ui:border-r-0 ui:border-t-0 ui:rounded-t-md',
      bgColor,
      errorMessage ? 'ui:border-red-500' : ''
    )}
    aria-invalid={errorMessage ? 'true' : undefined}
    {...textareaProps}
  />

  {#if errorMessage}
    <Field.Error>{errorMessage}</Field.Error>
  {:else if helperMessage}
    <Field.Description>{helperMessage}</Field.Description>
  {/if}
  {@render iconbutton?.()}
</Field.Field>
