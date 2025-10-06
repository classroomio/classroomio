<script lang="ts">
  // import CustomPromptBtn from '$lib/components/AI/AIButton/CustomPromptBtn.svelte';
  import type { PopoverProps } from 'carbon-components-svelte/types/Popover/Popover.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    label?: string;
    disabled?: boolean;
    placeholder?: any;
    value?: string;
    rows?: number;
    // export let maxRows = 3;
    className?: string;
    labelClassName?: string;
    bgColor?: string;
    helperMessage?: string;
    errorMessage?: string;
    isRequired?: boolean;
    onChange?: any; // This is to know if element is 'dirty'
    ref?: HTMLTextAreaElement | null;
    isAIEnabled?: boolean;
    initAIPrompt?: string;
    aiAlignPopover?: PopoverProps['align']; // $: minHeight = `${1 + parseInt(rows, 10) * 1.2}em`;
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
    bgColor = 'bg-gray-50 focus:bg-primary-50 dark:bg-neutral-700 dark:text-white',
    helperMessage = '',
    errorMessage = '',
    isRequired = false,
    onChange = () => {},
    ref = $bindable(null),
    // isAIEnabled = false,
    initAIPrompt = $bindable(''),
    // aiAlignPopover = 'left',
    iconbutton
  }: Props = $props();

  // $: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`;
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

      <!-- {#if isAIEnabled}
        <CustomPromptBtn
          bind:defaultPrompt={initAIPrompt}
          alignPopover={aiAlignPopover}
          handleInsert={(v) => {
            value = v;
          }}
        />
      {/if} -->
    </p>
  {/if}

  <!-- <pre
    aria-hidden="true"
    style="min-height: {minHeight}; max-height: {maxHeight}">
    {value + '\n'}
  </pre> -->

  <textarea
    {disabled}
    {rows}
    {placeholder}
    bind:value
    bind:this={ref}
    required={isRequired}
    class="form-textarea focus:border-primary-600 mt-1 block w-full rounded-t-md border-b-2 border-l-0 border-r-0 border-t-0 border-gray-200 focus:border-b-2 focus:border-l-0 focus:border-r-0 focus:border-t-0 dark:border-neutral-600
    {bgColor} {errorMessage ? 'border-red-500' : 'border-gray-300'}"
    onchange={onChange}
  ></textarea>
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

<style>
  .form-textarea {
    box-shadow: none !important;
  }
</style>
