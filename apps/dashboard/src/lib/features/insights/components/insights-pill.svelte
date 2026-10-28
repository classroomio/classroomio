<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import type { Snippet } from 'svelte';

  import type { InsightsPillTone } from '../utils/types';

  interface Props {
    tone: InsightsPillTone;
    children: Snippet;
  }

  let { tone, children }: Props = $props();

  const TONE_CLASS: Record<InsightsPillTone, string> = {
    ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    lag: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    risk: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    done: 'ui:bg-primary/10 ui:text-primary',
    none: 'ui:bg-muted ui:text-muted-foreground'
  };
</script>

<span class={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', TONE_CLASS[tone])}>
  {@render children()}
</span>
