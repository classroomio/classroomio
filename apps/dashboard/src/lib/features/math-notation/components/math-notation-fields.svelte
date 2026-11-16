<script lang="ts">
  import {
    MATH_DECIMAL_SEPARATORS,
    MATH_GRADE_BANDS,
    MATH_MULTIPLICATION_SIGNS,
    MATH_THOUSANDS_SEPARATORS,
    MATH_UNIT_SYSTEMS,
    type MathNotationSettings
  } from '@cio/question-types';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    value: MathNotationSettings;
    disabled?: boolean;
  }

  let { value = $bindable(), disabled = false }: Props = $props();

  const isClashingThousands = (separator: string) =>
    (value.decimalSeparator === 'comma' && separator === 'comma') ||
    (value.decimalSeparator === 'point' && separator === 'dot');

  function handleDecimalChange(next: string) {
    value.decimalSeparator = next as MathNotationSettings['decimalSeparator'];
    if (isClashingThousands(value.thousandsSeparator)) value.thousandsSeparator = 'none';
  }
</script>

<Field.Group>
  <Field.Field>
    <Field.Label>{$t('mathNotation.decimal.label')}</Field.Label>
    <Select.Root type="single" value={value.decimalSeparator} onValueChange={handleDecimalChange} {disabled}>
      <Select.Trigger class="w-full" data-testid="math-notation-decimal">
        {$t(`mathNotation.decimal.${value.decimalSeparator}`)}
      </Select.Trigger>
      <Select.Content>
        {#each MATH_DECIMAL_SEPARATORS as separator (separator)}
          <Select.Item value={separator}>{$t(`mathNotation.decimal.${separator}`)}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <Field.Description>{$t('mathNotation.decimal.hint')}</Field.Description>
  </Field.Field>

  <Field.Field>
    <Field.Label>{$t('mathNotation.thousands.label')}</Field.Label>
    <Select.Root type="single" bind:value={value.thousandsSeparator} {disabled}>
      <Select.Trigger class="w-full" data-testid="math-notation-thousands">
        {$t(`mathNotation.thousands.${value.thousandsSeparator}`)}
      </Select.Trigger>
      <Select.Content>
        {#each MATH_THOUSANDS_SEPARATORS as separator (separator)}
          <Select.Item value={separator} disabled={isClashingThousands(separator)}>
            {$t(`mathNotation.thousands.${separator}`)}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <Field.Description>{$t('mathNotation.thousands.hint')}</Field.Description>
  </Field.Field>

  <Field.Field>
    <Field.Label>{$t('mathNotation.multiplication.label')}</Field.Label>
    <Select.Root type="single" bind:value={value.multiplicationSign} {disabled}>
      <Select.Trigger class="w-full">{$t(`mathNotation.multiplication.${value.multiplicationSign}`)}</Select.Trigger>
      <Select.Content>
        {#each MATH_MULTIPLICATION_SIGNS as sign (sign)}
          <Select.Item value={sign}>{$t(`mathNotation.multiplication.${sign}`)}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <Field.Description>{$t('mathNotation.multiplication.hint')}</Field.Description>
  </Field.Field>

  <Field.Field>
    <Field.Label>{$t('mathNotation.unit.label')}</Field.Label>
    <Select.Root type="single" bind:value={value.unitSystem} {disabled}>
      <Select.Trigger class="w-full">{$t(`mathNotation.unit.${value.unitSystem}`)}</Select.Trigger>
      <Select.Content>
        {#each MATH_UNIT_SYSTEMS as unitSystem (unitSystem)}
          <Select.Item value={unitSystem}>{$t(`mathNotation.unit.${unitSystem}`)}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <Field.Description>{$t('mathNotation.unit.hint')}</Field.Description>
  </Field.Field>

  <Field.Field>
    <Field.Label>{$t('mathNotation.grade_band.label')}</Field.Label>
    <Select.Root type="single" bind:value={value.gradeBand} {disabled}>
      <Select.Trigger class="w-full">{$t(`mathNotation.grade_band.${value.gradeBand}`)}</Select.Trigger>
      <Select.Content>
        {#each MATH_GRADE_BANDS as gradeBand (gradeBand)}
          <Select.Item value={gradeBand}>{$t(`mathNotation.grade_band.${gradeBand}`)}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <Field.Description>{$t('mathNotation.grade_band.hint')}</Field.Description>
  </Field.Field>
</Field.Group>
