<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { cn } from '../../tools';
  import { Button } from '../../base/button';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props {
    href?: string;
    label?: string;
    class?: string;
    onclick?: HTMLButtonAttributes['onclick'];
  }

  let { href, label, class: className, onclick }: Props = $props();

  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (onclick) {
      onclick(e);
      return;
    }

    if (!href) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  }
</script>

{#if href}
  <Button variant="link" class={cn('ui:h-fit! ui:justify-start! ui:p-0', className)} {href}>
    <ArrowLeftIcon class="custom" />
    {#if label}
      <span class="ui:text-xs">{label}</span>
    {/if}
  </Button>
{:else}
  <Button variant="link" class={cn('ui:h-fit! ui:justify-start! ui:p-0', className)} onclick={handleClick}>
    <ArrowLeftIcon class="custom" />
    {#if label}
      <span class="ui:text-xs">{label}</span>
    {/if}
  </Button>
{/if}
