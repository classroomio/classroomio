<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import ShieldOffIcon from '@lucide/svelte/icons/shield-off';
  import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
  import Footprints from '@lucide/svelte/icons/footprints';
  import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
  import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
  import type { Component } from 'svelte';
  import type { ComplianceOverviewData } from '../utils/types';

  interface Props {
    data: ComplianceOverviewData | null;
  }

  let { data }: Props = $props();

  type Tile = {
    key: keyof ComplianceOverviewData['summary']['counts'];
    labelKey: string;
    icon: Component;
    tone: 'success' | 'warning' | 'danger' | 'info' | 'muted';
  };

  /** Order: healthy → risk → pipeline → administrative, so the grid reads left-to-top then downward. */
  const tiles: Tile[] = [
    { key: 'compliant', labelKey: 'compliance.status.compliant', icon: ShieldCheckIcon, tone: 'success' },
    { key: 'non_compliant', labelKey: 'compliance.status.non_compliant', icon: ShieldOffIcon, tone: 'danger' },
    { key: 'expiring_soon', labelKey: 'compliance.status.expiring_soon', icon: AlertTriangleIcon, tone: 'warning' },
    { key: 'in_grace_period', labelKey: 'compliance.status.in_grace_period', icon: ClockIcon, tone: 'warning' },
    { key: 'in_progress', labelKey: 'compliance.status.in_progress', icon: Footprints, tone: 'info' },
    { key: 'not_started', labelKey: 'compliance.status.not_started', icon: CircleDashedIcon, tone: 'muted' },
    { key: 'waived', labelKey: 'compliance.status.waived', icon: CircleSlashIcon, tone: 'muted' },
    { key: 'no_record', labelKey: 'compliance.status.no_record', icon: HelpCircleIcon, tone: 'muted' }
  ];

  const toneClass: Record<Tile['tone'], string> = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    info: 'ui:bg-primary/10 ui:text-primary',
    muted: 'ui:bg-muted ui:text-muted-foreground'
  };

  const counts = $derived(data?.summary.counts ?? null);
</script>

<Card.Root class="ui:bg-card">
  <Card.Header class="pb-2">
    <Card.Title class="text-base font-semibold">{$t('compliance.summary.heading')}</Card.Title>
    <Card.Description>{$t('compliance.summary.description')}</Card.Description>
  </Card.Header>
  <Card.Content class="pt-0">
    <div class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {#each tiles as tile (tile.key)}
        <div class="flex min-w-0 flex-col gap-2">
          <div class={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClass[tile.tone])}>
            <tile.icon class="h-4 w-4" />
          </div>
          <p class="ui:text-foreground text-2xl font-semibold tabular-nums">{counts?.[tile.key] ?? 0}</p>
          <p class="ui:text-muted-foreground text-xs leading-snug">{$t(tile.labelKey)}</p>
        </div>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
