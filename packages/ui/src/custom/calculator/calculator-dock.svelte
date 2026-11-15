<script module lang="ts">
  const DESMOS_SCRIPT_URL = 'https://www.desmos.com/api/v1.11/calculator.js';
  const pendingScripts = new Map<string, Promise<void>>();

  function loadDesmosScript(apiKey: string): Promise<void> {
    let pending = pendingScripts.get(apiKey);
    if (pending) return pending;

    pending = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${DESMOS_SCRIPT_URL}?apiKey=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Desmos failed to load'));
      document.head.appendChild(script);
    });
    pendingScripts.set(apiKey, pending);

    return pending;
  }
</script>

<script lang="ts">
  import type { CalculatorPolicy } from '@cio/question-types';
  import CalculatorIcon from '@lucide/svelte/icons/calculator';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../base/button';
  import { IconButton } from '../icon-button';
  import Calculator from './calculator.svelte';
  import { DEFAULT_CALCULATOR_LABELS, type BuiltInCalculatorMode, type CalculatorLabels } from './types';

  interface Props {
    /** The exercise's calculator policy. `none` renders nothing. */
    policy: CalculatorPolicy;
    /** Desmos API key from the organization's settings. Without one, the graphing policy uses the built-in scientific calculator. */
    desmosApiKey?: string | null;
    labels?: CalculatorLabels;
    /** Opens the panel on first render, for stories and tests. */
    defaultOpen?: boolean;
  }

  let { policy, desmosApiKey = null, labels = DEFAULT_CALCULATOR_LABELS, defaultOpen = false }: Props = $props();

  let isOpen = $state(defaultOpen);
  let desmosElement = $state<HTMLElement | null>(null);
  let desmosStatus = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  const usesDesmos = $derived(policy === 'graphing' && Boolean(desmosApiKey));
  const builtInMode = $derived<BuiltInCalculatorMode>(policy === 'four_function' ? 'four_function' : 'scientific');

  $effect(() => {
    if (!isOpen || !usesDesmos || !desmosElement || !desmosApiKey) return;

    let calculator: { destroy: () => void } | null = null;
    let isCancelled = false;
    desmosStatus = 'loading';

    loadDesmosScript(desmosApiKey)
      .then(() => {
        if (isCancelled || !desmosElement) return;

        const desmos = (
          window as unknown as { Desmos?: { GraphingCalculator: (element: HTMLElement) => typeof calculator } }
        ).Desmos;
        calculator = desmos?.GraphingCalculator(desmosElement) ?? null;
        desmosStatus = calculator ? 'ready' : 'failed';
      })
      .catch(() => {
        if (!isCancelled) desmosStatus = 'failed';
      });

    return () => {
      isCancelled = true;
      calculator?.destroy();
    };
  });
</script>

{#if policy !== 'none'}
  <div
    class="ui:fixed ui:right-4 ui:bottom-4 ui:z-app-bar-elevated ui:flex ui:flex-col ui:items-end ui:gap-2"
    data-testid="calculator-dock"
    data-policy={policy}
  >
    {#if isOpen}
      <div class="ui:bg-background ui:rounded-lg ui:border ui:p-3 ui:shadow-lg" role="dialog" aria-label={labels.title}>
        <div class="ui:mb-2 ui:flex ui:items-center ui:justify-between ui:gap-2">
          <p class="ui:text-sm ui:font-medium">{labels.title}</p>
          <IconButton type="button" size="icon-sm" tooltip={labels.close} onclick={() => (isOpen = false)}>
            <XIcon class="ui:size-4" />
          </IconButton>
        </div>
        {#if usesDesmos}
          <div class="ui:h-96 ui:w-[min(90vw,28rem)]">
            {#if desmosStatus === 'loading'}
              <p class="ui:text-muted-foreground ui:text-sm">{labels.graphingLoading}</p>
            {:else if desmosStatus === 'failed'}
              <p class="ui:text-destructive ui:text-sm">{labels.graphingFailed}</p>
            {/if}
            <div bind:this={desmosElement} class="ui:h-full ui:w-full"></div>
          </div>
        {:else}
          <Calculator mode={builtInMode} {labels} />
        {/if}
      </div>
    {/if}
    <Button type="button" size="sm" onclick={() => (isOpen = !isOpen)} aria-expanded={isOpen}>
      <CalculatorIcon class="ui:mr-1 ui:size-4" />
      {labels.open}
    </Button>
  </div>
{/if}
