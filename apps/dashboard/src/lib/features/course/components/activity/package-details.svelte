<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Table from '@cio/ui/base/table';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import AwardIcon from '@lucide/svelte/icons/award';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import PackageIcon from '@lucide/svelte/icons/package';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
  import UnlinkIcon from '@lucide/svelte/icons/unlink';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { t } from '$lib/utils/functions/translations';
  import type { PackageDetails } from '$features/course/utils/types';
  import { formatPackageBytes, formatScormVersion, unitPassMark } from '$features/course/utils/scorm-utils';

  interface Props {
    details: PackageDetails;
    moduleOrder?: 'free' | 'sequential' | null;
    staleCount?: number;
    staleVersionNumber?: number | null;
    onUpgrade?: () => void;
    onSwap?: () => void;
    onRemove?: () => void;
    onMoveStale?: () => void;
  }

  let {
    details,
    moduleOrder = null,
    staleCount = 0,
    staleVersionNumber = null,
    onUpgrade,
    onSwap,
    onRemove,
    onMoveStale
  }: Props = $props();

  let warningsOpen = $state(false);

  const current = $derived(details.currentVersion);
  const units = $derived(details.units ?? []);
  const launchable = $derived(units.filter((unit) => unit.unitType === 'sco'));
  const displayUnits = $derived(launchable.length > 0 ? launchable : units);
  const warnings = $derived(((current?.warnings as string[] | null) ?? []).filter(Boolean));
  const versions = $derived(details.versions ?? []);

  const passMark = $derived.by(() => {
    for (const unit of displayUnits) {
      const mark = unitPassMark(unit);
      if (mark !== null) return mark;
    }

    return null;
  });

  const totalBytes = $derived((current?.zipBytes ?? 0) + (current?.extractedBytes ?? 0));

  function warningKey(code: string): string | null {
    if (code === 'has_sequencing') {
      if (launchable.length < 2) return null;

      return moduleOrder === 'sequential'
        ? 'course.navItem.lessons.activities.package.sequencing_ordered'
        : 'course.navItem.lessons.activities.package.sequencing_unordered';
    }
    if (code === 'href_case_fixed') return 'course.navItem.lessons.activities.package.case_warning';
    if (code === 'manifest_rebased') return 'course.navItem.lessons.activities.package.rebased_warning';
    if (code === 'no_lms_api_detected') return 'course.navItem.lessons.activities.package.no_lms_warning';

    return null;
  }

  const activeWarnings = $derived(
    warnings.map((code) => warningKey(code)).filter((key): key is string => Boolean(key))
  );
</script>

<div class="space-y-5">
  <div
    class="ui:border-border relative overflow-hidden rounded-[calc(var(--radius)+6px)] border p-5 shadow-xs sm:p-[22px]"
    style="background: radial-gradient(120% 140% at 0% 0%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 55%), radial-gradient(90% 120% at 100% 100%, color-mix(in oklch, var(--success, oklch(0.596 0.145 163.225)) 12%, transparent), transparent 60%), var(--card);"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex min-w-0 items-start gap-4">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
          style="background: linear-gradient(145deg, var(--primary), oklch(0.55 0.22 285)); box-shadow: 0 4px 12px -4px var(--primary);"
        >
          <PackageIcon class="custom size-[22px] text-white" style="color: #ffffff;" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="ui:text-foreground truncate text-[19px] font-semibold tracking-[-0.01em]">
            {details.asset.title}
          </h2>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            {#if current?.status === 'ready'}
              <span
                class="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              >
                <span class="size-1.5 rounded-full bg-current"></span>
                {$t('course.navItem.lessons.activities.package.status.ready')}
              </span>
            {:else}
              <span
                class="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              >
                <span class="size-1.5 rounded-full bg-current"></span>
                {$t(`course.navItem.lessons.activities.package.status.${current?.status ?? 'processing'}`)}
              </span>
            {/if}
            <span class="ui:text-muted-foreground text-xs">
              {formatScormVersion(current?.format)} · {$t('course.navItem.lessons.activities.package.version', {
                version: current?.versionNumber ?? 1
              })}{#if versions.length > 1 && current?.id === versions[0]?.id}
                · {$t('course.navItem.lessons.activities.package.version_current')}{/if}
            </span>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2 self-start">
        {#if onUpgrade}
          <Button variant="default" size="sm" onclick={onUpgrade}>
            <UploadIcon class="custom mr-1.5 size-4" />
            {$t('course.navItem.lessons.activities.package.upload_new_version')}
          </Button>
        {/if}

        {#if onSwap || onRemove}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button {...props} variant="outline" size="sm">
                  {$t('course.navItem.lessons.activities.package.manage')}
                  <ChevronDownIcon class="custom ui:text-muted-foreground ml-1.5 size-4" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-56">
              {#if onSwap}
                <DropdownMenu.Item onclick={onSwap} class="cursor-pointer py-2">
                  <ArrowLeftRightIcon class="custom ui:text-muted-foreground mr-2 size-4" />
                  <div class="flex flex-col">
                    <span class="text-sm font-medium"
                      >{$t('course.navItem.lessons.activities.package.swap_package')}</span
                    >
                    <span class="ui:text-muted-foreground text-xs"
                      >{$t('course.navItem.lessons.activities.package.swap_description')}</span
                    >
                  </div>
                </DropdownMenu.Item>
              {/if}
              {#if onSwap && onRemove}
                <DropdownMenu.Separator />
              {/if}
              {#if onRemove}
                <DropdownMenu.Item
                  onclick={onRemove}
                  class="ui:text-destructive ui:focus:text-destructive cursor-pointer py-2"
                >
                  <UnlinkIcon class="custom mr-2 size-4" />
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{$t('course.navItem.lessons.activities.package.remove')}</span>
                    <span class="ui:text-muted-foreground text-xs"
                      >{$t('course.navItem.lessons.activities.package.remove_description')}</span
                    >
                  </div>
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    </div>

    <div class="mt-[18px] grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        class="ui:border-border ui:bg-background/70 flex items-center gap-3 rounded-[var(--radius)] border p-3 shadow-2xs backdrop-blur-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md sm:px-3.5 sm:py-3"
      >
        <div
          class="ui:bg-primary/10 ui:text-primary flex size-[34px] shrink-0 items-center justify-center rounded-[9px]"
          style="background: color-mix(in oklch, var(--primary) 12%, transparent); color: var(--primary);"
        >
          <AwardIcon class="custom size-[18px]" style="color: var(--primary);" />
        </div>
        <div class="min-w-0">
          <div class="ui:text-muted-foreground truncate text-xs">
            {$t('course.navItem.lessons.activities.package.stat_pass_mark')}
          </div>
          <div class="ui:text-foreground text-base leading-tight font-semibold tabular-nums">
            {passMark !== null ? `${passMark}%` : $t('course.navItem.lessons.activities.package.none')}
          </div>
        </div>
      </div>

      <div
        class="ui:border-border ui:bg-background/70 flex items-center gap-3 rounded-[var(--radius)] border p-3 shadow-2xs backdrop-blur-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md sm:px-3.5 sm:py-3"
      >
        <div
          class="ui:bg-primary/10 ui:text-primary flex size-[34px] shrink-0 items-center justify-center rounded-[9px]"
          style="background: color-mix(in oklch, var(--primary) 12%, transparent); color: var(--primary);"
        >
          <LayersIcon class="custom size-[18px]" style="color: var(--primary);" />
        </div>
        <div class="min-w-0">
          <div class="ui:text-muted-foreground truncate text-xs">
            {$t('course.navItem.lessons.activities.package.modules')}
          </div>
          <div class="ui:text-foreground text-base leading-tight font-semibold tabular-nums">
            {displayUnits.length}
          </div>
        </div>
      </div>

      <div
        class="ui:border-border ui:bg-background/70 flex items-center gap-3 rounded-[var(--radius)] border p-3 shadow-2xs backdrop-blur-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md sm:px-3.5 sm:py-3"
      >
        <div
          class="ui:bg-primary/10 ui:text-primary flex size-[34px] shrink-0 items-center justify-center rounded-[9px]"
          style="background: color-mix(in oklch, var(--primary) 12%, transparent); color: var(--primary);"
        >
          <FileTextIcon class="custom size-[18px]" style="color: var(--primary);" />
        </div>
        <div class="min-w-0">
          <div class="ui:text-muted-foreground truncate text-xs">
            {$t('course.navItem.lessons.activities.package.files')}
          </div>
          <div class="ui:text-foreground text-base leading-tight font-semibold tabular-nums">
            {current?.fileCount ?? units.length}
          </div>
        </div>
      </div>

      <div
        class="ui:border-border ui:bg-background/70 flex items-center gap-3 rounded-[var(--radius)] border p-3 shadow-2xs backdrop-blur-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md sm:px-3.5 sm:py-3"
      >
        <div
          class="ui:bg-primary/10 ui:text-primary flex size-[34px] shrink-0 items-center justify-center rounded-[9px]"
          style="background: color-mix(in oklch, var(--primary) 12%, transparent); color: var(--primary);"
        >
          <HardDriveIcon class="custom size-[18px]" style="color: var(--primary);" />
        </div>
        <div class="min-w-0">
          <div class="ui:text-muted-foreground truncate text-xs">
            {$t('course.navItem.lessons.activities.package.size')}
          </div>
          <div class="ui:text-foreground text-base leading-tight font-semibold tabular-nums">
            {formatPackageBytes(totalBytes || null)}
          </div>
        </div>
      </div>
    </div>

    {#if staleCount > 0}
      <div
        class="mt-3.5 flex flex-wrap items-center gap-3 rounded-[var(--radius)] bg-amber-500/15 px-3.5 py-2.5 text-[13px] dark:bg-amber-500/20"
      >
        <span class="relative flex size-2 shrink-0">
          <span class="absolute -inset-0.75 inline-flex animate-ping rounded-full border-2 border-amber-500 opacity-75"
          ></span>
          <span class="relative inline-flex size-2 rounded-full bg-amber-500"></span>
        </span>
        <span class="ui:text-foreground grow text-[13px]">
          {$t('course.navItem.lessons.activities.package.stale_banner', {
            count: staleCount,
            version: staleVersionNumber ?? 1
          })}
        </span>
        {#if onMoveStale}
          <button
            type="button"
            class="ui:text-primary cursor-pointer text-[13px] font-semibold hover:underline"
            onclick={onMoveStale}
          >
            {$t('course.navItem.lessons.activities.package.move_stale')}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  {#if activeWarnings.length > 0}
    <Collapsible.Root
      bind:open={warningsOpen}
      class="overflow-hidden rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 shadow-xs dark:bg-amber-500/15"
    >
      <Collapsible.Trigger
        class="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-amber-500/15"
      >
        <TriangleAlertIcon class="custom size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span class="font-medium text-amber-900 dark:text-amber-200">
          {$t('course.navItem.lessons.activities.package.warnings_summary', {
            count: activeWarnings.length
          })}
        </span>
        <ChevronDownIcon
          class={`custom ml-auto size-4 text-amber-700/70 transition-transform duration-200 dark:text-amber-300/70 ${warningsOpen ? 'rotate-180' : ''}`}
        />
      </Collapsible.Trigger>
      <Collapsible.Content class="border-t border-amber-500/20 px-3.5 py-3 pl-8">
        <ul class="list-disc space-y-1.5 text-[13px] text-amber-950/80 dark:text-amber-200/90">
          {#each activeWarnings as warningKey (warningKey)}
            <li>{$t(warningKey)}</li>
          {/each}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  {/if}

  {#if displayUnits.length > 0}
    <div class="ui:border-border ui:bg-card overflow-hidden rounded-[calc(var(--radius)+4px)] border shadow-xs">
      <div class="ui:border-border flex items-center gap-2 border-b px-4 py-3.5 sm:px-[18px]">
        <h3 class="ui:text-foreground text-sm font-semibold">
          {$t('course.navItem.lessons.activities.package.modules')}
        </h3>
        <span
          class="ui:bg-secondary ui:text-secondary-foreground inline-flex h-5 items-center rounded-full px-2 text-xs font-medium tabular-nums"
        >
          {displayUnits.length}
        </span>
        {#if displayUnits.length > 1}
          <span class="ui:text-muted-foreground text-xs">
            · {moduleOrder === 'sequential'
              ? $t('course.navItem.lessons.activities.package.module_order_sequential')
              : $t('course.navItem.lessons.activities.package.module_order_free')}
          </span>
        {/if}
      </div>

      <div class="overflow-x-auto">
        <Table.Root>
          <Table.Header class="ui:bg-muted">
            <Table.Row class="ui:hover:bg-muted">
              <Table.Head class="ui:text-muted-foreground w-12 text-center text-[11.5px] tracking-[0.06em] uppercase">
                {$t('course.navItem.lessons.activities.package.table_num')}
              </Table.Head>
              <Table.Head class="ui:text-muted-foreground text-[11.5px] tracking-[0.06em] uppercase">
                {$t('course.navItem.lessons.activities.package.table_title')}
              </Table.Head>
              <Table.Head class="ui:text-muted-foreground w-24 text-[11.5px] tracking-[0.06em] uppercase">
                {$t('course.navItem.lessons.activities.package.table_type')}
              </Table.Head>
              <Table.Head class="ui:text-muted-foreground w-36 text-[11.5px] tracking-[0.06em] uppercase">
                {$t('course.navItem.lessons.activities.package.table_grading')}
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each displayUnits as unit, index (unit.id)}
              {@const mark = unitPassMark(unit)}
              <Table.Row class="ui:hover:bg-muted transition-colors">
                <Table.Cell class="ui:text-muted-foreground w-12 text-center font-mono text-xs tabular-nums">
                  {index + 1}
                </Table.Cell>
                <Table.Cell class="ui:text-foreground text-sm font-medium">
                  {unit.title}
                </Table.Cell>
                <Table.Cell class="w-24">
                  <span class="ui:text-muted-foreground font-mono text-xs uppercase">
                    {unit.unitType}
                  </span>
                </Table.Cell>
                <Table.Cell class="w-36">
                  {#if mark !== null}
                    <span
                      class="ui:bg-primary/10 ui:text-primary inline-flex h-[22px] items-center rounded-full px-2.5 text-xs font-medium"
                      style="background: color-mix(in oklch, var(--primary) 12%, transparent); color: var(--primary);"
                    >
                      {$t('course.navItem.lessons.activities.package.graded_pass', { score: mark })}
                    </span>
                  {:else}
                    <span class="ui:text-muted-foreground text-xs">
                      {$t('course.navItem.lessons.activities.package.ungraded')}
                    </span>
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  {/if}
</div>
