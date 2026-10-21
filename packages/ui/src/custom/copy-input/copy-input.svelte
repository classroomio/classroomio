<script lang="ts">
  import * as InputGroup from '../../base/input-group';
  import { UseClipboard } from '../../hooks/use-clipboard.svelte';
  import { cn } from '../../tools';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CopyIcon from '@lucide/svelte/icons/copy';

  interface Props {
    value: string;
    buttonRef?: HTMLButtonElement | null;
    copyLabel?: string;
    copiedLabel?: string;
    class?: string;
    testId?: string;
    onCopy?: (status: 'success' | 'failure' | undefined) => void;
  }

  let {
    value,
    buttonRef = $bindable(null),
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    class: className,
    testId,
    onCopy
  }: Props = $props();

  const clipboard = new UseClipboard({ delay: 2000 });

  async function handleCopy() {
    const status = await clipboard.copy(value);
    onCopy?.(status);
  }

  function selectAll(event: FocusEvent) {
    (event.currentTarget as HTMLInputElement).select();
  }
</script>

<InputGroup.Root class={cn('ui:w-full', className)} data-slot="copy-input">
  <InputGroup.Input {value} readonly class="ui:font-mono ui:text-sm" onfocus={selectAll} data-testid={testId} />
  <InputGroup.Addon align="inline-end">
    <InputGroup.Button bind:ref={buttonRef} size="sm" onclick={handleCopy} aria-live="polite">
      {#if clipboard.copied}
        <CheckIcon />
        {copiedLabel}
      {:else}
        <CopyIcon />
        {copyLabel}
      {/if}
    </InputGroup.Button>
  </InputGroup.Addon>
</InputGroup.Root>
