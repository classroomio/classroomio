<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';

  interface Props {
    label: string;
    href: string;
    labelFieldLabel: string;
    hrefFieldLabel: string;
    labelPlaceholder?: string;
    hrefPlaceholder?: string;
    className?: string;
    removeAriaLabel?: string;
    onLabelInput: (value: string) => void;
    onHrefInput: (value: string) => void;
    onRemove?: () => void;
  }

  let {
    label,
    href,
    labelFieldLabel,
    hrefFieldLabel,
    labelPlaceholder,
    hrefPlaceholder,
    className = 'space-y-4',
    removeAriaLabel,
    onLabelInput,
    onHrefInput,
    onRemove
  }: Props = $props();
</script>

<div class={className}>
  {#if onRemove}
    <Button
      type="button"
      variant="secondary"
      class="absolute! -top-3! right-2!"
      aria-label={removeAriaLabel}
      onclick={() => onRemove()}
    >
      <TrashIcon size={16} />
    </Button>
  {/if}

  <Field.Field>
    <Field.Label>{labelFieldLabel}</Field.Label>
    <Input value={label} placeholder={labelPlaceholder} oninput={(event) => onLabelInput(event.currentTarget.value)} />
  </Field.Field>

  <Field.Field>
    <Field.Label>{hrefFieldLabel}</Field.Label>
    <Input value={href} placeholder={hrefPlaceholder} oninput={(event) => onHrefInput(event.currentTarget.value)} />
  </Field.Field>
</div>
