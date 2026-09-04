<script lang="ts">
  import { onMount } from 'svelte';
  import * as Field from '../../base/field';
  import { Input, type InputProps } from '../../base/input';

  type InputOnChangeEvent = Parameters<NonNullable<InputProps['onchange']>>[0];
  type InputOnInputEvent = Parameters<NonNullable<InputProps['oninput']>>[0];
  type InputOnBlurEvent = Parameters<NonNullable<InputProps['onblur']>>[0];

  interface Props {
    label?: string;
    placeholder?: string;
    value?: string | number | null;
    name?: string;
    onKeyDown?: (e: KeyboardEvent) => void;
    className?: string;
    labelClassName?: string;
    inputClassName?: string;
    type?: string;
    autoFocus?: boolean;
    isRequired?: boolean;
    isDisabled?: boolean;
    min?: string | number | null | undefined;
    max?: string | number | null | undefined;
    step?: string | number | null | undefined;
    maxLength?: number;
    errorMessage?: string;
    helperMessage?: string;
    autoComplete?: boolean;
    /** Stable hook for Playwright (`data-testid`). Prefer over CSS classes or translated labels. */
    testId?: string;
    onchange?: (e: InputOnChangeEvent) => void;
    onblur?: (e: InputOnBlurEvent) => void;
    oninput?: (e: InputOnInputEvent) => void;
    onInputChange?: (e: InputOnInputEvent | InputOnChangeEvent) => void;
    labelAction?: import('svelte').Snippet;
  }

  let {
    label = '',
    placeholder = '',
    value = $bindable(),
    name = '',
    onKeyDown = (_e) => {},
    className = '',
    labelClassName = '',
    inputClassName = '',
    type = $bindable('text'),
    autoFocus = false,
    isRequired = false,
    isDisabled = false,
    min = undefined,
    max = undefined,
    step = undefined,
    maxLength = undefined,
    errorMessage = '',
    helperMessage = '',
    autoComplete = true,
    testId,
    onchange = () => {},
    onblur = () => {},
    oninput = () => {},
    onInputChange = () => {},
    labelAction
  }: Props = $props();

  let inputRef: HTMLInputElement | null = $state(null);

  onMount(() => {
    if (autoFocus && inputRef) {
      inputRef.focus();
    }
  });

  // Handle live input event (typing, pasting, speech-to-text)
  function handleInput(e: InputOnInputEvent) {
    oninput(e);
    onInputChange(e);
  }

  // Handle commit / change event
  function handleChange(e: InputOnChangeEvent) {
    onchange(e);
    onInputChange(e);
  }

  // Handle blur event
  function handleBlur(e: InputOnBlurEvent) {
    onblur(e);
  }
</script>

<Field.Field class={className}>
  {#if label}
    <div class="ui:flex ui:items-center ui:justify-between">
      <Field.Label for={name || 'input-field'} class={labelClassName} required={isRequired}>
        {label}
      </Field.Label>
      {@render labelAction?.()}
    </div>
  {/if}

  <Input
    class={inputClassName}
    bind:ref={inputRef}
    id={name || 'input-field'}
    data-testid={testId}
    {type}
    {placeholder}
    bind:value
    {name}
    {min}
    {max}
    {step}
    maxlength={maxLength}
    required={isRequired}
    disabled={isDisabled}
    autocomplete={autoComplete ? 'on' : 'off'}
    aria-invalid={errorMessage ? 'true' : undefined}
    onkeydown={onKeyDown}
    oninput={handleInput}
    onchange={handleChange}
    onblur={handleBlur}
  />

  {#if errorMessage}
    <Field.Error>{errorMessage}</Field.Error>
  {:else if helperMessage}
    <Field.Description>{helperMessage}</Field.Description>
  {/if}
</Field.Field>
