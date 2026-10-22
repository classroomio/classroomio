<script lang="ts">
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import AwardIcon from '@lucide/svelte/icons/award';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import * as Table from '@cio/ui/base/table';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { getRelativeDayLabelKey } from '$features/course/utils/lesson-version-utils';
  import { formatPackageBytes, formatScormVersion, unitPassMark } from '$features/course/utils/scorm-utils';
  import { locale, t } from '$lib/utils/functions/translations';
  import type { AttachedPackageDetails } from '$features/course/utils/types';

  type VersionItem = NonNullable<AttachedPackageDetails['versions']>[number];

  interface Props {
    open?: boolean;
    packageDetails: AttachedPackageDetails;
    moduleOrder?: 'free' | 'sequential' | null;
    onClose?: () => void;
    onRevert?: (version: VersionItem) => void;
  }

  let { open = false, packageDetails, moduleOrder = null, onClose, onRevert }: Props = $props();

  const VERSION_PARAM = 'version';

  const versions = $derived([...(packageDetails.versions ?? [])].sort((a, b) => b.versionNumber - a.versionNumber));
  const currentVersion = $derived(packageDetails.currentVersion);
  const units = $derived(packageDetails.units ?? []);
  const launchableUnits = $derived(units.filter((unit) => unit.unitType === 'sco'));
  const displayUnits = $derived(launchableUnits.length > 0 ? launchableUnits : units);

  let selectedVersionId = $state<string | null>(null);
  let dialogEl = $state<HTMLElement | null>(null);

  const selectedVersion = $derived(
    versions.find((v) => v.id === selectedVersionId) ?? versions[0] ?? currentVersion ?? null
  );
  const selectedStats = $derived(
    packageDetails.versionStats?.find((stat) => stat.versionId === selectedVersion?.id) ?? null
  );
  const isSelectedCurrent = $derived(selectedVersion?.id === currentVersion?.id);

  const dateLocale = $derived($locale || 'en');

  onMount(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const urlVersion = page.url.searchParams.get(VERSION_PARAM);
    if (urlVersion) {
      const match = versions.find((v) => v.id === urlVersion || String(v.versionNumber) === urlVersion);
      if (match) {
        selectedVersionId = match.id;
      }
    }

    if (!selectedVersionId && versions[0]) {
      selectedVersionId = versions[0].id;
    }

    dialogEl?.querySelector('button')?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  });

  function formatTimestamp(timestamp: Date) {
    return new Intl.DateTimeFormat(dateLocale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(timestamp);
  }

  function formatTime(timestamp: Date) {
    return new Intl.DateTimeFormat(dateLocale, { hour: 'numeric', minute: 'numeric' }).format(timestamp);
  }

  function formatDayHeading(dayKey: number) {
    const relativeKey = getRelativeDayLabelKey(dayKey);
    if (relativeKey) {
      return t.get(`course.navItem.lessons.version_history.${relativeKey}`);
    }

    return new Intl.DateTimeFormat(dateLocale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dayKey));
  }

  interface VersionDayGroup {
    dayKey: number;
    versions: VersionItem[];
  }

  const versionsByDay = $derived.by(() => {
    const groups: VersionDayGroup[] = [];

    for (const version of versions) {
      const dayStart = new Date(version.createdAt);
      dayStart.setHours(0, 0, 0, 0);

      const dayKey = dayStart.getTime();
      const openGroup = groups.at(-1);

      if (openGroup?.dayKey === dayKey) {
        openGroup.versions.push(version);
        continue;
      }

      groups.push({ dayKey, versions: [version] });
    }

    return groups;
  });

  function syncVersionToUrl(versionId: string | null) {
    const url = new URL(page.url);

    if (versionId === null) {
      url.searchParams.delete(VERSION_PARAM);
    } else {
      url.searchParams.set(VERSION_PARAM, versionId);
    }

    if (url.search === page.url.search) return;

    replaceState(resolve(`${url.pathname}${url.search}${url.hash}`, {}), page.state);
  }

  function selectVersion(version: VersionItem) {
    selectedVersionId = version.id;
    syncVersionToUrl(version.id);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose?.();
      return;
    }

    if (event.key !== 'Tab' || !dialogEl) return;

    const focusables = [
      ...dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ].filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) return;

    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const selectedBytes = $derived((selectedVersion?.zipBytes ?? 0) + (selectedVersion?.extractedBytes ?? 0));

  function warningKey(code: string): string | null {
    if (code === 'has_sequencing') {
      if (launchableUnits.length < 2) return null;

      return moduleOrder === 'sequential'
        ? 'course.navItem.lessons.activities.package.sequencing_ordered'
        : 'course.navItem.lessons.activities.package.sequencing_unordered';
    }
    if (code === 'href_case_fixed') return 'course.navItem.lessons.activities.package.case_warning';
    if (code === 'manifest_rebased') return 'course.navItem.lessons.activities.package.rebased_warning';
    if (code === 'no_lms_api_detected') return 'course.navItem.lessons.activities.package.no_lms_warning';
    if (code === 'has_prerequisites') return 'course.navItem.lessons.activities.package.prerequisites_warning';

    return null;
  }

  const activeWarnings = $derived(
    ((selectedVersion?.warnings as string[] | null) ?? [])
      .filter(Boolean)
      .map((code) => warningKey(code))
      .filter((key): key is string => Boolean(key))
  );

  const passMark = $derived.by(() => {
    if (!isSelectedCurrent) return selectedStats?.firstPassMark ?? null;

    for (const unit of displayUnits) {
      const mark = unitPassMark(unit);
      if (mark !== null) return mark;
    }

    return null;
  });

  const selectedModuleCount = $derived(
    isSelectedCurrent ? displayUnits.length : (selectedStats?.unitCount ?? displayUnits.length)
  );

  const selectedVersionTitle = $derived(selectedVersion?.title?.trim() || packageDetails.asset.title);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <aside
    bind:this={dialogEl}
    class="ui:bg-background fixed inset-0 z-250 flex h-screen w-screen flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="activity-version-history-title"
  >
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="ui:border-border ui:bg-background flex h-16 shrink-0 items-center justify-between border-b px-5">
        <div class="flex min-w-0 items-center gap-3">
          <IconButton
            onclick={onClose}
            aria-label={$t('course.navItem.lessons.poll.back')}
            tooltip={$t('course.navItem.lessons.poll.back')}
          >
            <ArrowLeftIcon size={18} />
          </IconButton>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">
              {selectedVersion ? formatTimestamp(new Date(selectedVersion.createdAt)) : packageDetails.asset.title}
            </p>
            {#if selectedVersion}
              <p class="ui:text-muted-foreground truncate text-xs">{selectedVersionTitle}</p>
            {/if}
          </div>
        </div>

        {#if selectedVersion && selectedVersion.id !== currentVersion?.id && selectedVersion.status === 'ready'}
          <Button variant="secondary" onclick={() => onRevert?.(selectedVersion)}>
            {$t('course.navItem.lessons.version_history.restore_version')}
          </Button>
        {/if}
      </header>

      <main class="ui:bg-muted/40 flex-1 overflow-y-auto p-6 lg:p-10">
        <article
          class="ui:border-border ui:bg-background mx-auto min-h-full w-full max-w-4xl space-y-6 border p-6 shadow-xs sm:p-8"
        >
          {#if selectedVersion}
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2.5">
                  <h1 class="ui:text-foreground text-2xl font-bold tracking-tight">
                    {$t('course.navItem.lessons.activities.package.version', {
                      version: selectedVersion.versionNumber
                    })}
                  </h1>
                  {#if selectedVersion.id === currentVersion?.id}
                    <Badge variant="success">
                      {$t('course.navItem.lessons.activities.package.version_current')}
                    </Badge>
                  {:else if selectedVersion.status !== 'ready'}
                    <Badge variant="secondary">
                      {$t(`course.navItem.lessons.activities.package.status.${selectedVersion.status}`)}
                    </Badge>
                  {/if}
                </div>
                <p class="ui:text-muted-foreground mt-1 text-sm">{selectedVersionTitle}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="ui:border-border/80 ui:bg-background/80 flex items-center gap-3 rounded-lg border p-3">
                <div
                  class="ui:bg-primary/10 ui:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <AwardIcon class="size-4.5" />
                </div>
                <div class="min-w-0">
                  <div class="ui:text-muted-foreground truncate text-xs">
                    {$t('course.navItem.lessons.activities.package.stat_pass_mark')}
                  </div>
                  <div class="ui:text-foreground text-sm font-semibold tabular-nums">
                    {passMark !== null ? `${passMark}%` : $t('course.navItem.lessons.activities.package.none')}
                  </div>
                </div>
              </div>

              <div class="ui:border-border/80 ui:bg-background/80 flex items-center gap-3 rounded-lg border p-3">
                <div
                  class="ui:bg-primary/10 ui:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <LayersIcon class="size-4.5" />
                </div>
                <div class="min-w-0">
                  <div class="ui:text-muted-foreground truncate text-xs">
                    {$t('course.navItem.lessons.activities.package.modules')}
                  </div>
                  <div class="ui:text-foreground text-sm font-semibold tabular-nums">
                    {selectedModuleCount}
                  </div>
                </div>
              </div>

              <div class="ui:border-border/80 ui:bg-background/80 flex items-center gap-3 rounded-lg border p-3">
                <div
                  class="ui:bg-primary/10 ui:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <FileTextIcon class="size-4.5" />
                </div>
                <div class="min-w-0">
                  <div class="ui:text-muted-foreground truncate text-xs">
                    {$t('course.navItem.lessons.activities.package.files')}
                  </div>
                  <div class="ui:text-foreground text-sm font-semibold tabular-nums">
                    {selectedVersion.fileCount ?? units.length}
                  </div>
                </div>
              </div>

              <div class="ui:border-border/80 ui:bg-background/80 flex items-center gap-3 rounded-lg border p-3">
                <div
                  class="ui:bg-primary/10 ui:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
                >
                  <HardDriveIcon class="size-4.5" />
                </div>
                <div class="min-w-0">
                  <div class="ui:text-muted-foreground truncate text-xs">
                    {$t('course.navItem.lessons.activities.package.size')}
                  </div>
                  <div class="ui:text-foreground text-sm font-semibold tabular-nums">
                    {formatPackageBytes(selectedBytes || null)}
                  </div>
                </div>
              </div>
            </div>

            <div class="ui:border-border/80 ui:bg-muted/20 space-y-2 rounded-lg border p-4 text-xs">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="ui:text-muted-foreground">SCORM Format</span>
                <span class="ui:text-foreground font-medium">{formatScormVersion(selectedVersion.format)}</span>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="ui:text-muted-foreground">Created</span>
                <span class="ui:text-foreground font-medium">
                  {formatTimestamp(new Date(selectedVersion.createdAt))}
                </span>
              </div>
              {#if selectedVersion.manifestIdentifier}
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="ui:text-muted-foreground">Manifest ID</span>
                  <span class="ui:text-muted-foreground max-w-xs truncate font-mono">
                    {selectedVersion.manifestIdentifier}
                  </span>
                </div>
              {/if}
            </div>

            {#if activeWarnings.length > 0}
              <div class="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 dark:bg-amber-500/10">
                <div class="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-200">
                  <TriangleAlertIcon class="size-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {$t('course.navItem.lessons.activities.package.warnings_summary', {
                      count: activeWarnings.length
                    })}
                  </span>
                </div>
                <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-950/80 dark:text-amber-200/90">
                  {#each activeWarnings as wKey (wKey)}
                    <li>{$t(wKey)}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if selectedVersion.id === currentVersion?.id && displayUnits.length > 0}
              <div class="ui:border-border overflow-hidden rounded-xl border">
                <div class="ui:border-border ui:bg-muted/30 flex items-center justify-between border-b px-4 py-3">
                  <h3 class="ui:text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    {$t('course.navItem.lessons.activities.package.modules')}
                  </h3>
                  <Badge variant="secondary" class="text-xs tabular-nums">
                    {displayUnits.length}
                  </Badge>
                </div>
                <Table.Root>
                  <Table.Header class="ui:bg-muted/20">
                    <Table.Row>
                      <Table.Head class="w-12 text-center text-xs">
                        {$t('course.navItem.lessons.activities.package.table_num')}
                      </Table.Head>
                      <Table.Head class="text-xs">
                        {$t('course.navItem.lessons.activities.package.table_title')}
                      </Table.Head>
                      <Table.Head class="w-24 text-xs">
                        {$t('course.navItem.lessons.activities.package.table_type')}
                      </Table.Head>
                      <Table.Head class="w-40 text-xs">
                        {$t('course.navItem.lessons.activities.package.table_grading')}
                      </Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each displayUnits as unit, index (unit.id)}
                      {@const mark = unitPassMark(unit)}
                      <Table.Row>
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
                        <Table.Cell class="w-40">
                          {#if mark !== null}
                            <Badge variant="default" class="text-xs font-normal">
                              {$t('course.navItem.lessons.activities.package.graded_pass', { score: mark })}
                            </Badge>
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
            {/if}
          {/if}
        </article>
      </main>
    </div>

    <div
      class="ui:border-border ui:bg-muted/30 flex max-h-80 w-full shrink-0 flex-col border-b lg:max-h-none lg:w-88 lg:border-b-0 lg:border-l"
    >
      <div class="ui:border-border flex h-16 shrink-0 items-center border-b px-5">
        <h2 id="activity-version-history-title" class="text-base font-semibold">
          {$t('course.navItem.lessons.version_history.title')}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-4">
        {#if versions.length === 0}
          <p class="ui:text-muted-foreground px-3 py-6 text-center text-sm">
            {$t('course.navItem.lessons.version_history.empty')}
          </p>
        {/if}

        {#each versionsByDay as day (day.dayKey)}
          <section class="mb-4">
            <h3 class="ui:text-muted-foreground px-3 pb-1 text-xs font-semibold tracking-wide uppercase">
              {formatDayHeading(day.dayKey)}
            </h3>

            <div class="space-y-1">
              {#each day.versions as version (version.id)}
                {@const isSelected = selectedVersion?.id === version.id}
                <Button
                  onclick={() => selectVersion(version)}
                  variant={isSelected ? 'secondary' : 'ghost'}
                  class="h-full w-full justify-start text-left"
                >
                  <ChevronRightIcon class="mt-0.5 shrink-0" size={16} />
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="truncate text-sm font-medium">
                        {$t('course.navItem.lessons.activities.package.version', {
                          version: version.versionNumber
                        })}
                      </span>
                      {#if version.id === currentVersion?.id}
                        <Badge variant="success" class="text-xs">
                          {$t('course.navItem.lessons.activities.package.version_current')}
                        </Badge>
                      {:else if version.status !== 'ready'}
                        <Badge variant="secondary" class="text-xs">
                          {$t(`course.navItem.lessons.activities.package.status.${version.status}`)}
                        </Badge>
                      {/if}
                    </span>

                    <span class="ui:text-muted-foreground mt-0.5 block truncate text-xs">
                      {formatTime(new Date(version.createdAt))}
                      {#if version.zipBytes}
                        · {formatPackageBytes(version.zipBytes)}
                      {/if}
                    </span>
                  </span>
                </Button>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    </div>
  </aside>
{/if}
