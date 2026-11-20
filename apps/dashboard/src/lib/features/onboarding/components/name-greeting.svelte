<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  const typedName = $derived(name.trim());
</script>

<p
  class="ui:text-foreground ui:font-brand-mono flex flex-wrap items-baseline gap-x-[0.45em] text-[26px] leading-tight font-medium tracking-[-0.02em]"
  aria-live="polite"
>
  <span>{$t('onboarding.v2.business.greeting')}</span>
  <span class="inline-flex min-w-0 [overflow-wrap:anywhere]">
    {#if typedName}
      <span>{typedName}</span>
    {:else}
      <b class="ui:text-primary font-medium" aria-hidden="true">&#123;&#123;</b>
      <span class="ui:text-muted-foreground px-[0.25em]">{$t('onboarding.v2.business.greeting_placeholder')}</span>
      <b class="ui:text-primary font-medium" aria-hidden="true">&#125;&#125;</b>
    {/if}
  </span>
  <i
    class="ui:bg-foreground -ml-[0.3em] h-[1.05em] w-0.5 self-center motion-safe:animate-[greeting-blink_1.1s_steps(1)_infinite]"
    aria-hidden="true"
  ></i>
</p>

<style>
  @keyframes -global-greeting-blink {
    50% {
      opacity: 0;
    }
  }
</style>
