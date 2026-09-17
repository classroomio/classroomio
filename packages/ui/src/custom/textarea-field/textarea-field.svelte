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
    /** Stable hook for Playwright (`data-testid`). */
    testId?: string;
    labelAction?: import('svelte').Snippet;
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
    testId,
    labelAction,
    iconbutton,
    value = $bindable(),
    ...textareaProps
  }: Props = $props();
</script>

<Field.Field class={className}>
  {#if label}
    <div class="ui:flex ui:items-center ui:justify-between">
      <Field.Label class={labelClassName}>
        {label}
        {#if isRequired}
          <span class="ui:text-red-700">*</span>
        {/if}
      </Field.Label>
      {@render labelAction?.()}
    </div>
  {/if}

  <Textarea
    bind:value
    class={cn(bgColor, errorMessage ? 'ui:border-red-500' : '')}
    aria-invalid={errorMessage ? 'true' : undefined}
    data-testid={testId}
    {...textareaProps}
  />

  {#if errorMessage}
    <Field.Error>{errorMessage}</Field.Error>
  {:else if helperMessage}
    <Field.Description>{helperMessage}</Field.Description>
  {/if}
  {@render iconbutton?.()}
</Field.Field>
