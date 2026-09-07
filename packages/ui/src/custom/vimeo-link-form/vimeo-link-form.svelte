<script lang="ts">
  import { Button } from '../../base/button';
  import { Input } from '../../base/input';
  import { Label } from '../../base/label';
  import { cn } from '../../tools';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { splitLinks, toCanonicalVimeoUrl } from '@cio/utils';
  import { ExternalLinkIcon } from '../moving-icons';

  interface Props {
    inputLabel: string;
    inputPlaceholder?: string;
    addButtonLabel: string;
    invalidVimeoMessage: string;
    privacyHintPrefix?: string;
    privacyHintSuffix?: string;
    disabled?: boolean;
    class?: string;
    onSubmit?: (links: string[]) => Promise<void> | void;
    onInputChange?: (value: string) => void;
  }

  let {
    inputLabel,
    inputPlaceholder = '',
    addButtonLabel,
    invalidVimeoMessage,
    privacyHintPrefix = '',
    privacyHintSuffix = '',
    disabled = false,
    class: className = '',
    onSubmit = () => {},
    onInputChange = () => {}
  }: Props = $props();

  let rawInput = $state('');
  let validationError = $state('');
  let isSubmitting = $state(false);
  let hasCopiedDomain = $state(false);

  const currentHost = $derived(typeof window !== 'undefined' ? window.location.host : '');

  function handleInputChange(event: Event) {
    const nextValue = (event.currentTarget as HTMLInputElement).value;
    if (nextValue === rawInput) return;

    rawInput = nextValue;
    validationError = '';
    onInputChange(rawInput);
  }

  async function handleCopyDomain() {
    if (!currentHost) return;

    try {
      await navigator.clipboard.writeText(currentHost);
      hasCopiedDomain = true;
      setTimeout(() => {
        hasCopiedDomain = false;
      }, 2000);
    } catch {
      // Best-effort copy fallback
    }
  }

  async function addVimeoLink() {
    if (disabled || isSubmitting) return;

    const links = splitLinks(rawInput)
      .map(toCanonicalVimeoUrl)
      .filter((entry): entry is string => Boolean(entry));

    const dedupedLinks = Array.from(new Set(links));

    if (dedupedLinks.length === 0) {
      validationError = invalidVimeoMessage;
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

<div class={cn('ui:w-full ui:space-y-2', className)}>
  <form
    class="ui:flex ui:w-full ui:items-end ui:justify-between ui:gap-4"
    onsubmit={(event) => {
      event.preventDefault();
      void addVimeoLink();
    }}
  >
    <div class="ui:flex-1 ui:space-y-1">
      <Label>{inputLabel}</Label>
      <Input
        value={rawInput}
        disabled={disabled || isSubmitting}
        placeholder={inputPlaceholder}
        oninput={handleInputChange}
      />
      {#if validationError}
        <p class="ui:text-destructive ui:text-xs">{validationError}</p>
      {/if}
    </div>

    <Button type="submit" disabled={disabled || isSubmitting}>{addButtonLabel}</Button>
  </form>

  {#if currentHost}
    <p class="ui:pt-0.5 ui:text-xs ui:leading-relaxed ui:text-muted-foreground">
      <span>{privacyHintPrefix}</span>
      <button
        type="button"
        onclick={handleCopyDomain}
        class="ui:inline-flex ui:cursor-pointer ui:items-center ui:gap-1 ui:rounded ui:bg-muted ui:px-1.5 ui:py-0.5 ui:font-mono ui:font-medium ui:text-foreground ui:transition-colors ui:hover:bg-muted/80 ui:align-baseline"
        title="Copy domain to clipboard"
      >
        <span>{currentHost}</span>
        {#if hasCopiedDomain}
          <CheckIcon size={12} class="ui:text-emerald-500" />
        {:else}
          <CopyIcon size={12} />
        {/if}
      </button>
      <span>{privacyHintSuffix}</span>
      <a
        href="https://help.vimeo.com/hc/en-us/articles/30030693052305-How-do-I-set-up-domain-level-privacy"
        target="_blank"
        rel="noreferrer noopener"
        class="ui:ml-0.5 ui:inline-flex ui:items-center ui:text-primary ui:hover:underline ui:align-baseline"
        title="Vimeo Privacy Settings Documentation"
      >
        <ExternalLinkIcon size={12} class="ui:text-muted-foreground" />
      </a>
    </p>
  {/if}
</div>
