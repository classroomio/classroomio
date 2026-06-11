<script lang="ts">
  import { Checkbox } from '../../base/checkbox';
  import * as Field from '../../base/field';

  interface Props {
    id: string;
    title: string;
    description?: string;
    checked: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    titleSuffix?: import('svelte').Snippet;
    leading?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
    /** Overridable CSS class (e.g. for grid column span or custom layout) */
    class?: string;
  }

  let {
    id,
    title,
    description,
    checked,
    disabled = false,
    onCheckedChange,
    titleSuffix,
    leading,
    footer,
    class: className
  }: Props = $props();
</script>

<Field.Label for={id} class={className}>
  <Field.Field orientation="horizontal">
    {#if leading}
      {@render leading()}
    {/if}
    <Field.Content>
      <Field.Title class="ui:flex ui:items-center ui:gap-2">
        {title}
        {#if titleSuffix}
          {@render titleSuffix()}
        {/if}
      </Field.Title>
      {#if description}
        <Field.Description>{description}</Field.Description>
      {/if}
    </Field.Content>
    <Checkbox
      {id}
      aria-label={title}
      {disabled}
      {checked}
      onCheckedChange={(value) => onCheckedChange?.(value === true)}
    />
  </Field.Field>
  {#if footer}
    <div class="ui:-mt-1 ui:min-w-0 ui:px-4 ui:pb-3">
      {@render footer()}
    </div>
  {/if}
</Field.Label>
