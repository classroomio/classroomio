<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import LockIcon from '@lucide/svelte/icons/lock';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Label } from '@cio/ui/base/label';
  import * as Sheet from '@cio/ui/base/sheet';
  import { courseApi, courseTemplateApi } from '$features/course/api';
  import { formatTemplateUsedDate, templateSettingDisplay } from '$features/course/utils/template-display';
  import { deselectUnitAndNewChildren, selectUnitWithParents } from '$features/course/utils/template-updates';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseTemplateUpdates } from '$features/course/utils/types';
  import type { SyncableSettingKey } from '@cio/utils/validation/course';

  let open = $state(false);

  const selectedUnits = new SvelteSet<string>();
  const selectedSettings = new SvelteSet<string>();

  const updates = $derived(courseTemplateApi.updates);
  const units = $derived(updates?.units ?? []);
  const settings = $derived(updates?.settings ?? []);
  const selectableUnits = $derived(units.filter((unit) => !unit.locked));
  const selectedCount = $derived(selectedUnits.size + selectedSettings.size);

  function clearSelection() {
    selectedUnits.clear();
    selectedSettings.clear();
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) clearSelection();

    open = isOpen;
  }

  function replaceUnitSelection(next: Set<string>) {
    selectedUnits.clear();
    for (const id of next) selectedUnits.add(id);
  }

  function toggleUnit(unitId: string, checked: boolean) {
    if (checked) {
      replaceUnitSelection(selectUnitWithParents(units, selectedUnits, unitId));
      return;
    }

    replaceUnitSelection(deselectUnitAndNewChildren(units, selectedUnits, unitId));
  }

  function toggleAllUnits(checked: boolean) {
    if (!checked) {
      selectedUnits.clear();
      return;
    }

    let next = new Set<string>();
    for (const unit of selectableUnits) {
      next = selectUnitWithParents(units, next, unit.id);
    }

    replaceUnitSelection(next);
  }

  function selectSetting(setting: CourseTemplateUpdates['settings'][number]) {
    selectedSettings.add(setting.key);
    if (setting.requiresUnitId)
      replaceUnitSelection(selectUnitWithParents(units, selectedUnits, setting.requiresUnitId));
  }

  function toggleSetting(setting: CourseTemplateUpdates['settings'][number], checked: boolean) {
    if (checked) selectSetting(setting);
    else selectedSettings.delete(setting.key);
  }

  function toggleAllSettings(checked: boolean) {
    selectedSettings.clear();
    if (!checked) return;

    for (const setting of settings) selectSetting(setting);
  }

  function requiredUnit(setting: CourseTemplateUpdates['settings'][number]) {
    if (!setting.requiresUnitId) return null;

    return units.find((unit) => unit.id === setting.requiresUnitId) ?? null;
  }

  function place(unit: CourseTemplateUpdates['units'][number]) {
    const kind = $t(`course_templates.sync.kind.${unit.kind}`);
    if (!unit.parentTitle) return kind;

    return `${kind} · ${unit.parentTitle}`;
  }

  function detail(unit: CourseTemplateUpdates['units'][number]) {
    const parts: string[] = [];
    if (unit.titleChanged) parts.push($t('course_templates.sync.detail.title'));
    if (unit.contentChanged) parts.push($t('course_templates.sync.detail.content'));
    if (unit.localesAdded.length > 0) {
      parts.push($t('course_templates.sync.detail.locales', { locales: unit.localesAdded.join(', ') }));
    }

    return parts.join(' · ');
  }

  function newParent(unit: CourseTemplateUpdates['units'][number]) {
    if (unit.change !== 'new' || !unit.parentId) return null;

    const parent = units.find((item) => item.id === unit.parentId);
    if (!parent || parent.change !== 'new') return null;

    return parent;
  }

  async function pull() {
    const courseId = courseApi.course?.id;
    if (!courseId || selectedCount === 0 || courseTemplateApi.pulling) return;

    await courseTemplateApi.pullUpdates(courseId, [...selectedUnits], [...selectedSettings] as SyncableSettingKey[]);
    if (!courseTemplateApi.error) {
      selectedUnits.clear();
      selectedSettings.clear();
      open = false;
    }
  }
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button {...props} class="shrink-0" variant="secondary" size="sm">
        {$t('course_templates.sync.review')}
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content class="sm:max-w-md">
    <Sheet.Header>
      <Sheet.Title>{$t('course_templates.sync.sheet_title')}</Sheet.Title>
      {#if updates?.template}
        <Sheet.Description>
          {$t('course_templates.sync.sheet_description', {
            title: updates.template.title,
            date: formatTemplateUsedDate(updates.lastPulledAt ?? '')
          })}
        </Sheet.Description>
      {/if}
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-4">
      {#if courseTemplateApi.updatesLoading && !updates}
        <p class="ui:text-muted-foreground text-sm">{$t('course_templates.sync.loading')}</p>
      {/if}
      {#if units.length > 0}
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-medium">{$t('course_templates.sync.content')}</h3>
            <Label class="ui:text-muted-foreground gap-2 text-xs font-normal">
              <Checkbox
                checked={selectableUnits.length > 0 && selectableUnits.every((unit) => selectedUnits.has(unit.id))}
                disabled={selectableUnits.length === 0}
                onCheckedChange={(checked) => toggleAllUnits(checked === true)}
              />
              {$t('course_templates.sync.select_all')}
            </Label>
          </div>
          {#each units as unit (unit.id)}
            <Label class="flex items-start gap-3 text-sm font-normal {unit.locked ? 'opacity-60' : ''}">
              <Checkbox
                class="mt-0.5"
                checked={selectedUnits.has(unit.id)}
                disabled={unit.locked}
                onCheckedChange={(checked) => toggleUnit(unit.id, checked === true)}
              />
              <span class="min-w-0">
                <span class="flex flex-wrap items-center gap-2">
                  <Badge variant={unit.change === 'new' ? 'default' : 'secondary'}>
                    {unit.change === 'new' ? $t('course_templates.sync.new') : $t('course_templates.sync.updated')}
                  </Badge>
                  <span class="font-medium">{unit.title}</span>
                </span>
                <span class="ui:text-muted-foreground mt-1 block text-xs">{place(unit)}</span>
                {#if detail(unit)}
                  <span class="ui:text-muted-foreground block text-xs">{detail(unit)}</span>
                {/if}
                {#if unit.locked}
                  <span class="ui:text-muted-foreground flex items-center gap-1 text-xs">
                    <LockIcon class="size-3 shrink-0" />
                    {$t('course_templates.sync.locked', { count: unit.submissionCount })}
                  </span>
                {/if}
                {#if unit.removedLocally}
                  <span class="ui:text-muted-foreground block text-xs"
                    >{$t('course_templates.sync.removed_locally')}</span
                  >
                {/if}
                {#if unit.editedLocally}
                  <span class="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                    <TriangleAlertIcon class="size-3 shrink-0" />
                    {$t('course_templates.sync.edited_locally', {
                      date: formatTemplateUsedDate(unit.editedAt ?? '')
                    })}
                  </span>
                {/if}
                {#if newParent(unit) != null}
                  {@const addedParent = newParent(unit)}
                  <span class="ui:text-muted-foreground block text-xs">
                    {$t('course_templates.sync.also_adds', {
                      kind: $t(`course_templates.sync.kind.${addedParent?.kind}`),
                      title: addedParent?.title
                    })}
                  </span>
                {/if}
              </span>
            </Label>
          {/each}
        </section>
      {/if}

      {#if settings.length > 0}
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-medium">{$t('course_templates.sync.settings')}</h3>
            <Label class="ui:text-muted-foreground gap-2 text-xs font-normal">
              <Checkbox
                checked={settings.every((setting) => selectedSettings.has(setting.key))}
                onCheckedChange={(checked) => toggleAllSettings(checked === true)}
              />
              {$t('course_templates.sync.select_all')}
            </Label>
          </div>
          {#each settings as setting (setting.key)}
            {@const templateDisplay = templateSettingDisplay(setting.key, setting.templateValue, $t)}
            {@const courseDisplay = templateSettingDisplay(setting.key, setting.courseValue, $t)}
            {@const addedUnit = requiredUnit(setting)}
            <Label class="flex items-start gap-3 text-sm font-normal">
              <Checkbox
                class="mt-0.5"
                checked={selectedSettings.has(setting.key)}
                onCheckedChange={(checked) => toggleSetting(setting, checked === true)}
              />
              <span class="min-w-0">
                <span class="font-medium">{$t(`course_templates.sync.setting.${setting.key}`)}</span>
                {#if templateDisplay.kind === 'image' || courseDisplay.kind === 'image'}
                  <span class="mt-1.5 flex gap-3">
                    {#each [{ labelKey: 'course_templates.sync.template_label', display: templateDisplay }, { labelKey: 'course_templates.sync.yours_label', display: courseDisplay }] as side (side.labelKey)}
                      <span class="ui:text-muted-foreground flex flex-col gap-1 text-xs">
                        {$t(side.labelKey)}
                        {#if side.display.kind === 'image'}
                          <img
                            src={side.display.url}
                            alt=""
                            class="ui:border-border ui:bg-muted h-12 w-20 rounded-md border object-cover"
                          />
                        {:else}
                          <span
                            class="ui:border-border flex h-12 w-20 items-center justify-center rounded-md border border-dashed"
                          >
                            {side.display.text}
                          </span>
                        {/if}
                      </span>
                    {/each}
                  </span>
                {:else}
                  <span class="ui:text-muted-foreground block text-xs break-words">
                    {$t('course_templates.sync.template_value', { value: templateDisplay.text })}
                    ·
                    {$t('course_templates.sync.yours_value', { value: courseDisplay.text })}
                  </span>
                {/if}
                {#if addedUnit}
                  <span class="ui:text-muted-foreground block text-xs">
                    {$t('course_templates.sync.also_adds', {
                      kind: $t(`course_templates.sync.kind.${addedUnit.kind}`),
                      title: addedUnit.title
                    })}
                  </span>
                {/if}
              </span>
            </Label>
          {/each}
        </section>
      {/if}
    </div>

    <Sheet.Footer class="flex-row items-center justify-between">
      <span class="ui:text-muted-foreground text-sm">
        {selectedCount === 0
          ? $t('course_templates.sync.nothing_selected')
          : $t('course_templates.sync.selected', { count: selectedCount })}
      </span>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" type="button" onclick={() => handleOpenChange(false)}>
          {$t('course_templates.preview.cancel')}
        </Button>
        <Button
          size="sm"
          testId="template-sync-pull"
          disabled={selectedCount === 0}
          loading={courseTemplateApi.pulling}
          onclick={pull}
        >
          {$t('course_templates.sync.pull', { count: selectedCount })}
        </Button>
      </div>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
