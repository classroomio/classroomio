<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/NumberField',
    component: NumberField,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onValueChange: { control: false },
      onCommit: { control: false },
      onFocus: { control: false },
      onBlur: { control: false },
      onInput: { control: false },
      labelAction: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let defaultValue = $state<number | null>(50);
  let labeledValue = $state<number | null>(null);
  let errorValue = $state<number | null>(150);
  let disabledValue = $state<number | null>(42);
  let integerValue = $state<number | null>(5);
  let decimalValue = $state<number | null>(null);
  let optionalValue = $state<number | null>(10);
  let requiredValue = $state<number | null>(7);
  let externalValue = $state<number | null>(20);
</script>

<Story name="Default">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField label="Score" placeholder="Enter a number" bind:value={defaultValue} />
      <p class="ui:text-muted-foreground text-sm">Value: {defaultValue ?? '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="Label and Helper">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Course Points"
        placeholder="0-100"
        bind:value={labeledValue}
        min={0}
        max={100}
        helperMessage="Enter the points for this assignment"
      />
      <p class="ui:text-muted-foreground text-sm">Value: {labeledValue ?? '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Error">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Threshold"
        bind:value={errorValue}
        min={0}
        max={100}
        errorMessage="Value must be between 0 and 100"
      />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Enrolled Students"
        bind:value={disabledValue}
        isDisabled={true}
        helperMessage="This field cannot be modified"
      />
    </div>
  {/snippet}
</Story>

<Story name="Integer With Bounds">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Max Attempts"
        bind:value={integerValue}
        integer
        min={1}
        max={10}
        helperMessage="Whole numbers from 1 to 10"
      />
      <p class="ui:text-muted-foreground text-sm">Value: {integerValue ?? '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="Decimal">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Course Price"
        placeholder="0.0"
        bind:value={decimalValue}
        min={0}
        step={0.1}
        helperMessage="Enter the price in your local currency"
      />
      <p class="ui:text-muted-foreground text-sm">Value: {decimalValue ?? '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="Allow Empty">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Bonus Points"
        placeholder="Optional"
        bind:value={optionalValue}
        allowEmpty
        helperMessage="Clearing this field emits null immediately"
      />
      <p class="ui:text-muted-foreground text-sm">Value: {optionalValue ?? '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="Required Revert">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField
        label="Pass Threshold"
        bind:value={requiredValue}
        integer
        min={0}
        max={100}
        helperMessage="Clear and blur to restore the value from before you focused the field"
      />
      <p class="ui:text-muted-foreground text-sm">Value: {requiredValue ?? '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="External Update">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <NumberField label="Live Score" bind:value={externalValue} min={0} max={100} />
      <p class="ui:text-muted-foreground text-sm">Value: {externalValue ?? '(empty)'}</p>
      <button
        type="button"
        class="ui:bg-primary ui:text-primary-foreground rounded-md px-4 py-2"
        onclick={() => (externalValue = 85)}
      >
        Set to 85 externally
      </button>
    </div>
  {/snippet}
</Story>
