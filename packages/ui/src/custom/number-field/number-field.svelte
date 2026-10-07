<script lang="ts">
  import { onMount } from 'svelte';
  import { parseBoundedInteger, parseBoundedNumber, parseNumberInRange } from '@cio/utils/functions';
  import * as Field from '../../base/field';
  import { Input } from '../../base/input';
  import { FieldDraft } from '../../hooks/field-draft.svelte';
  import type { NumberFieldProps } from './types';

  let {
    value = $bindable(null),
    min,
    max,
    step,
    integer = false,
    allowEmpty = false,
    onValueChange,
    onCommit,
    onInput,
    label = '',
    name = '',
    placeholder = '',
    className = '',
    labelClassName = '',
    inputClassName = '',
    isRequired = false,
    isDisabled = false,
    errorMessage = '',
    helperMessage = '',
    testId,
    labelAction,
    autoFocus = false,
    onFocus,
    onBlur
  }: NumberFieldProps = $props();

  const uid = $props.id();
  const inputId = $derived(name || `number-field-${uid}`);

  let baseline: number | null = null;

  const numberField = new FieldDraft<number | null>({
    value: () => value ?? null,
    format: (current) => (current === null ? '' : String(current)),
    parse: (text) => {
      if (text.trim() === '') return allowEmpty ? null : undefined;

      return parseNumberInRange(text, { min, max, integer });
    },
    normalize: (text) => {
      const parseCommitted = integer ? parseBoundedInteger : parseBoundedNumber;
      const committed = parseCommitted(text, { min, max });
      if (committed !== undefined) return committed;

      if (allowEmpty) return null;

      return baseline ?? value ?? null;
    },
    onChange: (next) => {
      value = next;
      onValueChange?.(next);
    },
    onCommit: (next) => {
      onCommit?.(next);
    },
    onReseed: (next) => {
      baseline = next;
    }
  });

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    onInput?.(event.currentTarget.value);
    if (event.currentTarget.validity.badInput) return;

    numberField.input(event.currentTarget.value);
  }

  function handleCommit(event: Event & { currentTarget: HTMLInputElement }) {
    if (event.currentTarget.validity.badInput) {
      numberField.draft = event.currentTarget.value;
    }

    if (numberField.draft === (baseline === null ? '' : String(baseline))) return;

    numberField.commit();
  }

  function handleFocus(event: FocusEvent & { currentTarget: HTMLInputElement }) {
    baseline = value ?? null;
    onFocus?.(event);
  }

  let inputRef: HTMLInputElement | null = $state(null);

  onMount(() => {
    if (autoFocus && inputRef) {
      inputRef.focus();
    }
  });
</script>

<Field.Field class={className}>
  {#if label}
    <div class="ui:flex ui:items-center ui:justify-between">
      <Field.Label for={inputId} class={labelClassName} required={isRequired}>
        {label}
      </Field.Label>
      {@render labelAction?.()}
    </div>
  {/if}

  <Input
    class={inputClassName}
    bind:ref={inputRef}
    id={inputId}
    data-testid={testId}
    type="number"
    {placeholder}
    value={numberField.draft}
    {name}
    {min}
    {max}
    step={step ?? (integer ? 1 : 'any')}
    required={isRequired}
    disabled={isDisabled}
    aria-invalid={errorMessage ? 'true' : undefined}
    autofocus={autoFocus}
    oninput={handleInput}
    onchange={handleCommit}
    onkeydown={(event) => {
      if (event.key === 'Enter') handleCommit(event);
    }}
    onfocus={handleFocus}
    onblur={onBlur}
  />

  {#if errorMessage}
    <Field.Error>{errorMessage}</Field.Error>
  {:else if helperMessage}
    <Field.Description>{helperMessage}</Field.Description>
  {/if}
</Field.Field>
