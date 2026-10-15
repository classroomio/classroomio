<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Alert from '@cio/ui/base/alert';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
  import UnlinkIcon from '@lucide/svelte/icons/unlink';
  import PackageIcon from '@lucide/svelte/icons/package';
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

<div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
  <div class="ui:border-border ui:bg-card overflow-hidden rounded-[calc(var(--radius)+4px)] border shadow-xs">
    <div class="flex items-center gap-3.5 p-5">
      <div class="ui:border-border flex size-11 shrink-0 items-center justify-center rounded-xl border">
        <PackageIcon class="custom ui:text-muted-foreground size-[22px]" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="ui:text-foreground text-[17px] leading-snug font-semibold">
          {details.asset.title}
        </h2>
        <div class="ui:text-muted-foreground mt-0.5 text-xs">
          {formatScormVersion(current?.format)}
        </div>
      </div>
      <div class="ml-auto shrink-0">
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
      </div>
    </div>

    {#if activeWarnings.length > 0}
      <Alert.Root variant="warning" class="mx-5 mb-4 w-auto">
        <TriangleAlertIcon class="custom size-4" />
        <Alert.Title class="text-[13px] font-semibold">
          {$t('course.navItem.lessons.activities.package.warnings_summary', {
            count: activeWarnings.length
          })}
        </Alert.Title>
        <Alert.Description class="text-[13px] text-amber-900/90 dark:text-amber-100/90">
          {#if activeWarnings.length === 1}
            {$t(activeWarnings[0])}
          {:else}
            <ul class="list-disc space-y-1 pl-4">
              {#each activeWarnings as warningKey (warningKey)}
                <li>{$t(warningKey)}</li>
              {/each}
            </ul>
          {/if}
        </Alert.Description>
      </Alert.Root>
    {/if}

    {#if displayUnits.length > 0}
      <div class="ui:border-border flex items-center justify-between border-t px-5 py-3">
        <div class="flex items-center gap-2">
          <span class="ui:text-foreground text-[13px] font-semibold">
            {$t('course.navItem.lessons.activities.package.modules')}
          </span>
          <span
            class="ui:bg-secondary ui:text-secondary-foreground inline-flex h-5 items-center rounded-full px-2 text-xs font-medium tabular-nums"
          >
            {displayUnits.length}
          </span>
        </div>
        {#if displayUnits.length > 0}
          <span class="ui:text-muted-foreground text-xs font-normal">
            {#if launchable.length > 0}
              {$t('course.navItem.lessons.activities.package.launchable_count', { count: launchable.length })} ·
            {/if}
            {moduleOrder === 'sequential'
              ? $t('course.navItem.lessons.activities.package.module_order_sequential')
              : $t('course.navItem.lessons.activities.package.module_order_free')}
          </span>
        {/if}
      </div>

      <div>
        {#each displayUnits as unit, index (unit.id)}
          {@const mark = unitPassMark(unit)}
          <div class="mod ui:border-border flex items-center gap-3.5 border-t px-5 py-3">
            <span class="rail-line">
              <i>{index + 1}</i>
            </span>
            <span class="ui:text-foreground line-clamp-1 flex-1 text-sm font-medium">
              {unit.title}
            </span>
            {#if mark !== null}
              <span
                class="ui:bg-primary/10 ui:text-primary inline-flex h-[22px] items-center rounded-full px-2.5 text-xs font-medium"
                style="background: color-mix(in oklch, var(--primary) 12%, transparent); color: var(--primary);"
              >
                {$t('course.navItem.lessons.activities.package.graded_pass', { score: mark })}
              </span>
            {:else}
              <span class="ui:text-muted-foreground font-mono text-xs uppercase">
                {unit.unitType}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <aside
    class="ui:border-border ui:bg-card overflow-hidden rounded-[calc(var(--radius)+4px)] border p-[18px] shadow-xs lg:sticky lg:top-4"
  >
    <h3 class="ui:text-muted-foreground mb-2 text-xs font-semibold tracking-[0.06em] uppercase">
      {$t('course.navItem.lessons.activities.package.details')}
    </h3>

    <div class="ui:border-border flex items-center justify-between border-b border-dashed py-2 text-sm">
      <span class="ui:text-muted-foreground">{$t('course.navItem.lessons.activities.package.version_label')}</span>
      <span class="ui:text-foreground font-medium tabular-nums">
        {current?.versionNumber ?? 1}
        {#if versions.length > 1 && current?.id === versions[0]?.id}
          · {$t('course.navItem.lessons.activities.package.version_current')}
        {/if}
      </span>
    </div>

    <div class="ui:border-border flex items-center justify-between border-b border-dashed py-2 text-sm">
      <span class="ui:text-muted-foreground">{$t('course.navItem.lessons.activities.package.stat_pass_mark')}</span>
      <span class="ui:text-foreground font-medium tabular-nums">
        {passMark !== null ? `${passMark}%` : $t('course.navItem.lessons.activities.package.none')}
      </span>
    </div>

    <div class="ui:border-border flex items-center justify-between border-b border-dashed py-2 text-sm">
      <span class="ui:text-muted-foreground">{$t('course.navItem.lessons.activities.package.files')}</span>
      <span class="ui:text-foreground font-medium tabular-nums">
        {current?.fileCount ?? units.length}
      </span>
    </div>

    <div class="ui:border-border flex items-center justify-between border-b border-dashed py-2 text-sm">
      <span class="ui:text-muted-foreground">{$t('course.navItem.lessons.activities.package.size')}</span>
      <span class="ui:text-foreground font-medium tabular-nums">
        {formatPackageBytes(totalBytes || null)}
      </span>
    </div>

    {#if staleCount > 0}
      <div
        class="mt-2 flex items-start gap-2.5 rounded-[var(--radius)] bg-amber-500/15 p-3 text-[13px] dark:bg-amber-500/20"
      >
        <span class="relative mt-1 flex size-2 shrink-0">
          <span class="absolute -inset-0.75 inline-flex animate-ping rounded-full border-2 border-amber-500 opacity-75"
          ></span>
          <span class="relative inline-flex size-2 rounded-full bg-amber-500"></span>
        </span>
        <div class="min-w-0 flex-1 leading-snug">
          <div class="ui:text-foreground">
            {$t('course.navItem.lessons.activities.package.stale_banner', {
              count: staleCount,
              version: staleVersionNumber ?? 1
            })}
          </div>
          {#if onMoveStale}
            <button
              type="button"
              class="ui:text-primary mt-1 block cursor-pointer text-left text-xs font-semibold hover:underline"
              onclick={onMoveStale}
            >
              {$t('course.navItem.lessons.activities.package.move_stale')}
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <div class="mt-3 flex flex-col gap-2">
      {#if onUpgrade}
        <Button variant="default" class="w-full justify-start" onclick={onUpgrade}>
          <UploadIcon class="custom mr-2 size-4" />
          {$t('course.navItem.lessons.activities.package.upload_new_version')}
        </Button>
      {/if}

      {#if onSwap}
        <Button variant="outline" class="w-full justify-start" onclick={onSwap}>
          <ArrowLeftRightIcon class="custom mr-2 size-4" />
          {$t('course.navItem.lessons.activities.package.swap_package')}
        </Button>
      {/if}

      {#if onRemove}
        <Button
          variant="ghost"
          class="ui:text-destructive ui:hover:text-destructive ui:hover:bg-destructive/10 w-full justify-start"
          onclick={onRemove}
        >
          <UnlinkIcon class="custom mr-2 size-4" />
          {$t('course.navItem.lessons.activities.package.remove_package')}
        </Button>
      {/if}
    </div>
  </aside>
</div>

<style>
  .rail-line {
    position: relative;
    width: 22px;
    align-self: stretch;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }
  .rail-line::before {
    content: '';
    position: absolute;
    top: -12px;
    bottom: -12px;
    width: 2px;
    background: var(--border);
  }
  .mod:first-of-type .rail-line::before {
    top: 50%;
  }
  .mod:last-of-type .rail-line::before {
    bottom: 50%;
  }
  .rail-line i {
    position: relative;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--background);
    border: 2px solid var(--primary);
    display: grid;
    place-items: center;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    color: var(--primary);
    align-self: center;
    font-variant-numeric: tabular-nums;
  }
</style>
