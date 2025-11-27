<script lang="ts">
  import { Textarea } from '@cio/ui/base/textarea';
  import { Popover as PopoverPrimitive } from 'bits-ui';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    label?: string;
    disabled?: boolean;
    placeholder?: any;
    value?: string;
    rows?: number;
    className?: string;
    labelClassName?: string;
    helperMessage?: string;
    errorMessage?: string;
    isRequired?: boolean;
    onChange?: (e: Event) => void;
    ref?: HTMLTextAreaElement | null;
    isAIEnabled?: boolean;
    initAIPrompt?: string;
    aiAlignPopover?: PopoverPrimitive.ContentProps['align'];
    iconbutton?: import('svelte').Snippet;
  }

  let {
    label = '',
    disabled = false,
    placeholder = $t('course.navItem.lessons.exercises.all_exercises.write_your_answer'),
    value = $bindable(),
    rows = 3,
    className = '',
    labelClassName = '',
    helperMessage = '',
    errorMessage = '',
    isRequired = false,
    onChange = () => {},
    ref = $bindable(null),
    initAIPrompt = $bindable(''),
    iconbutton
  }: Props = $props();
</script>

<label for="text-field" class="relative block w-full {className}">
  {#if label}
    <p class="flex w-full items-center justify-between text-left dark:text-white {labelClassName}">
      <span>
        {label}
        {#if isRequired}
          <span class="text-red-700">*</span>
        {/if}
      </span>
    </p>
  {/if}

  <Textarea
    {disabled}
    {rows}
    {placeholder}
    bind:value
    bind:ref
    required={isRequired}
    onchange={onChange}
    class="mt-1 {errorMessage ? 'aria-invalid:border-red-500 border-red-500' : ''}"
    aria-invalid={!!errorMessage}
  />

  {#if !!errorMessage}
    <p class="text-sm text-red-500">
      {errorMessage}
    </p>
  {:else if helperMessage}
    <p class="text-sm text-gray-500 dark:text-white">
      {helperMessage}
    </p>
  {/if}
  {@render iconbutton?.()}
</label>
