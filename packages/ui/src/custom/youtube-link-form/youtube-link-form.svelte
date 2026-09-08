<script lang="ts">
  import { Button } from '../../base/button';
  import { Input } from '../../base/input';
  import { Label } from '../../base/label';
  import { cn } from '../../tools';
  import { extractUniqueLinks, toCanonicalYoutubeUrl } from '@cio/utils';

  interface Props {
    inputLabel: string;
    inputPlaceholder?: string;
    addButtonLabel: string;
    invalidYoutubeMessage: string;
    disabled?: boolean;
    class?: string;
    onSubmit?: (links: string[]) => Promise<void> | void;
    onInputChange?: (value: string) => void;
  }

  let {
    inputLabel,
    inputPlaceholder = '',
    addButtonLabel,
    invalidYoutubeMessage,
    disabled = false,
    class: className = '',
    onSubmit = () => {},
    onInputChange = () => {}
  }: Props = $props();

  let rawInput = $state('');
  let validationError = $state('');
  let isSubmitting = $state(false);

  function handleInputChange(event: Event) {
    rawInput = (event.currentTarget as HTMLInputElement).value;
    validationError = '';
    onInputChange(rawInput);
  }

  async function addYoutubeLink() {
    if (disabled || isSubmitting) return;

    const dedupedLinks = extractUniqueLinks(rawInput, toCanonicalYoutubeUrl);

    if (dedupedLinks.length === 0) {
      validationError = invalidYoutubeMessage;
      return;
    }

    validationError = '';
    isSubmitting = true;

    try {
      await onSubmit(dedupedLinks);
      rawInput = '';
      onInputChange('');
    } catch (error) {
      validationError = typeof error === 'string' ? error : (error as Error)?.message || 'Failed to add video';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form
  class={cn('ui:flex ui:w-full ui:items-end ui:justify-between ui:gap-4', className)}
  onsubmit={(event) => {
    event.preventDefault();
    void addYoutubeLink();
  }}
>
  <div class="ui:flex-1 ui:space-y-1">
    <Label>{inputLabel}</Label>
    <Input
      value={rawInput}
      disabled={disabled || isSubmitting}
      placeholder={inputPlaceholder}
      oninput={handleInputChange}
      onchange={handleInputChange}
    />
    {#if validationError}
      <p class="ui:text-destructive ui:text-xs">{validationError}</p>
    {/if}
  </div>

  <Button type="submit" disabled={disabled || isSubmitting}>{addButtonLabel}</Button>
</form>
