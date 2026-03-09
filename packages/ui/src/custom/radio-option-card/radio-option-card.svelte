<script lang="ts">
  import * as Field from '../../base/field';
  import * as RadioGroup from '../../base/radio-group';

  interface Props {
    id: string;
    title: string;
    description: string;
    value: string;
    disabled?: boolean;
    titleSuffix?: import('svelte').Snippet;
    /** Overridable CSS class (e.g. for grid column span or custom layout) */
    class?: string;
    /** Reserved for parent content (e.g. when used inside RadioOptionCardGroup) */
    children?: import('svelte').Snippet;
  }

  let {
    id,
    title,
    description,
    value,
    disabled = false,
    titleSuffix,
    class: className,
    children: _children
  }: Props = $props();
</script>

<Field.Label for={id} class={className}>
  <Field.Field orientation="horizontal">
    <Field.Content>
      <Field.Title class="ui:flex ui:items-center ui:gap-2">
        {title}
        {#if titleSuffix}
          {@render titleSuffix()}
        {/if}
      </Field.Title>
      <Field.Description>{description}</Field.Description>
    </Field.Content>
    <RadioGroup.Item {value} {id} aria-label={title} {disabled} />
  </Field.Field>
</Field.Label>
