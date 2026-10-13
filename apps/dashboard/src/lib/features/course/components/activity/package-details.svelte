<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Alert from '@cio/ui/base/alert';
  import { t } from '$lib/utils/functions/translations';
  import type { PackageDetails } from '$features/course/utils/types';
  import { formatPackageBytes, formatScormVersion, unitPassMark } from '$features/course/utils/scorm-utils';

  interface Props {
    details: PackageDetails;
    onUpgrade?: () => void;
    onSwap?: () => void;
    onRemove?: () => void;
  }

  let { details, onUpgrade, onSwap, onRemove }: Props = $props();

  const current = $derived(details.currentVersion);
  const units = $derived(details.units ?? []);
  const launchable = $derived(units.filter((unit) => unit.unitType === 'sco'));
  const warnings = $derived(((current?.warnings as string[] | null) ?? []).filter(Boolean));

  const passMark = $derived.by(() => {
    for (const unit of launchable) {
      const mark = unitPassMark(unit);
      if (mark !== null) return mark;
    }
    return null;
  });

  const totalBytes = $derived((current?.zipBytes ?? 0) + (current?.extractedBytes ?? 0));

  function warningKey(code: string): string | null {
    if (code === 'has_sequencing') return 'course.navItem.lessons.activities.package.sequencing_warning';
    if (code === 'href_case_fixed') return 'course.navItem.lessons.activities.package.case_warning';
    if (code === 'manifest_rebased') return 'course.navItem.lessons.activities.package.rebased_warning';

    return null;
  }
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-3 text-sm">
    <div>
      <p class="ui:text-muted-foreground text-xs">{details.asset.title}</p>
      <p class="font-medium">{formatScormVersion(current?.format)}</p>
    </div>
    <div>
      <p class="ui:text-muted-foreground text-xs">
        {$t('course.navItem.lessons.activities.package.version', { version: current?.versionNumber ?? 1 })}
      </p>
      <p class="font-medium">
        {$t(`course.navItem.lessons.activities.package.status.${current?.status ?? 'processing'}`)}
      </p>
    </div>
    <div>
      <p class="ui:text-muted-foreground text-xs">{$t('course.navItem.lessons.activities.package.files')}</p>
      <p class="font-medium tabular-nums">{current?.fileCount ?? units.length}</p>
    </div>
    <div>
      <p class="ui:text-muted-foreground text-xs">{$t('course.navItem.lessons.activities.package.size')}</p>
      <p class="font-medium tabular-nums">{formatPackageBytes(totalBytes || null)}</p>
    </div>
  </div>

  {#if passMark !== null}
    <p class="text-sm">{$t('course.navItem.lessons.activities.package.pass_mark', { score: passMark })}</p>
  {/if}

  {#each warnings as code (code)}
    {#if warningKey(code)}
      <Alert.Root variant="warning">
        <Alert.Description>{$t(warningKey(code)!)}</Alert.Description>
      </Alert.Root>
    {/if}
  {/each}

  {#if launchable.length > 1}
    <div class="space-y-1">
      <p class="text-sm font-medium">
        {$t('course.navItem.lessons.activities.package.modules_title', { count: launchable.length })}
      </p>
      <p class="ui:text-muted-foreground text-xs">
        {$t('course.navItem.lessons.activities.package.modules_hint')}
      </p>
      <ul class="mt-2 space-y-1">
        {#each launchable as unit (unit.id)}
          <li class="ui:border-border rounded-md border px-3 py-2 text-sm">{unit.title}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="flex flex-wrap gap-2">
    <Button variant="outline" size="sm" onclick={onUpgrade}>
      {$t('course.navItem.lessons.activities.package.upload_new_version')}
    </Button>
    <Button variant="outline" size="sm" onclick={onSwap}>
      {$t('course.navItem.lessons.activities.package.swap_package')}
    </Button>
    <Button variant="outline" size="sm" onclick={onRemove}>
      {$t('course.navItem.lessons.activities.package.remove')}
    </Button>
  </div>
</div>
