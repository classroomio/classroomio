<script lang="ts">
  import { onMount } from 'svelte';
  import * as Field from '../../base/field';
  import { Input, type InputProps } from '../../base/input';

  type InputOnChangeEvent = Parameters<NonNullable<InputProps['onchange']>>[0];

  interface Props {
    label?: string;
    placeholder?: string;
    value?: string | number | null;
    name?: string;
    onKeyDown?: (e: KeyboardEvent) => void;
    className?: string;
    labelClassName?: string;
    type?: string;
    autoFocus?: boolean;
    isRequired?: boolean;
    isDisabled?: boolean;
    min?: string | number | null | undefined;
    max?: string | number | null | undefined;
    errorMessage?: string;
    helperMessage?: string;
    autoComplete?: boolean;
    onchange?: (e: InputOnChangeEvent) => void;
    onInputChange?: (e: InputOnChangeEvent) => void;
  }

  let {
    label = '',
    placeholder = '',
    value = $bindable(),
    name = '',
    onKeyDown = (_e) => {},
    className = '',
    labelClassName = '',
    type = $bindable('text'),
    autoFocus = false,
    isRequired = false,
    isDisabled = false,
    min = undefined,
    max = undefined,
    errorMessage = '',
    helperMessage = '',
    autoComplete = true,
    onchange = () => {},
    onInputChange = () => {}
  }: Props = $props();

  let inputRef: HTMLInputElement | null = $state(null);

  onMount(() => {
    if (autoFocus && inputRef) {
      inputRef.focus();
    }
  });

  // Handle input change event
  function handleInputChange(e: InputOnChangeEvent) {
    onInputChange(e);
  }

  // Handle blur event
  function handleBlur(e: InputOnChangeEvent) {
    onchange(e);
  }
</script>

<Field.Field class={className}>
  {#if label}
    <Field.Label for={name || 'input-field'} class={labelClassName}>
      {label}
      {#if isRequired}
        <span class="text-red-700">*</span>
      {/if}
    </Field.Label>
  {/if}

  <Input
    bind:ref={inputRef}
    id={name || 'input-field'}
    {type}
    {placeholder}
    bind:value
    {name}
    {min}
    {max}
    required={isRequired}
    disabled={isDisabled}
    autocomplete={autoComplete ? 'on' : 'off'}
    aria-invalid={errorMessage ? 'true' : undefined}
    onkeydown={onKeyDown}
    onchange={handleInputChange}
    onblur={handleBlur}
  />

  {#if errorMessage}
    <Field.Error>{errorMessage}</Field.Error>
  {:else if helperMessage}
    <Field.Description>{helperMessage}</Field.Description>
  {/if}
</Field.Field>
