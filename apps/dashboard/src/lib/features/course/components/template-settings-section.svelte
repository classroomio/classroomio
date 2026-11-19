<script lang="ts">
  import * as Alert from '@cio/ui/base/alert';
  import { DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { SettingsCard } from '$features/ui';
  import { courseApi, courseTemplateApi } from '$features/course/api';
  import TemplateReviewSheet from './template-review-sheet.svelte';
  import { formatTemplateUsedDate } from '$features/course/utils/template-display';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin, currentOrgPath } from '$lib/utils/store/org';

  const course = $derived(courseApi.course);
  const updates = $derived(
    course && courseTemplateApi.updatesCourseId === course.id ? courseTemplateApi.updates : null
  );
  const visible = $derived(Boolean($isOrgAdmin && course?.templateId && !course.isTemplate && updates));
  const units = $derived(updates?.units ?? []);
  const settings = $derived(updates?.settings ?? []);
  const changeCount = $derived(units.length + settings.length);

  function joinList(parts: string[]) {
    if (parts.length <= 1) return parts[0] ?? '';

    const last = parts[parts.length - 1];
    return $t('course_templates.sync.join', { rest: parts.slice(0, -1).join(', '), last });
  }

  const summary = $derived.by(() => {
    const parts: string[] = [];
    const lessonCount = units.filter((unit) => unit.kind === 'lesson').length;
    const exerciseCount = units.filter((unit) => unit.kind === 'exercise').length;
    const sectionCount = units.filter((unit) => unit.kind === 'section').length;
    if (sectionCount) parts.push($t('course_templates.sync.sections_count', { count: sectionCount }));
    if (lessonCount) parts.push($t('courses.course_card.lessons_count', { count: lessonCount }));
    if (exerciseCount) parts.push($t('courses.course_card.exercises_count', { count: exerciseCount }));
    if (settings.length) parts.push($t('course_templates.sync.settings_count', { count: settings.length }));

    return $t('course_templates.sync.available_detail', { count: changeCount, list: joinList(parts) });
  });

  $effect(() => {
    const current = courseApi.course;
    if (!current?.id || !current.templateId || current.isTemplate || !$isOrgAdmin) return;

    void courseTemplateApi.loadUpdates(current.id);
  });
</script>

{#if visible && updates}
  <SettingsCard
    id="template"
    title={$t('course_templates.sync.section_title')}
    description={$t('course_templates.sync.section_description')}
  >
    {#if !updates.template || updates.template.deleted}
      <Alert.Root>
        <Alert.Title>{$t('course_templates.sync.deleted_title')}</Alert.Title>
        <Alert.Description>
          {updates.template
            ? $t('course_templates.sync.deleted', { title: updates.template.title })
            : $t('course_templates.sync.deleted_unknown')}
        </Alert.Description>
      </Alert.Root>
    {:else}
      <div class="flex items-center gap-3">
        <img
          src={updates.template.bannerImage || DEFAULT_COURSE_BANNER_IMAGE}
          alt=""
          class="h-12 w-20 rounded-md object-cover"
        />
        <div class="min-w-0 flex-1">
          <a
            class="truncate text-sm font-medium"
            href={updates.template.global
              ? `${$currentOrgPath}/courses/templates?preview=${updates.template.id}`
              : `/courses/${updates.template.id}/lessons`}
          >
            {updates.template.title}
          </a>
          <p class="ui:text-muted-foreground text-xs">
            {$t('course_templates.sync.last_pulled', { date: formatTemplateUsedDate(updates.lastPulledAt ?? '') })}
          </p>
        </div>
        {#if changeCount > 0}
          <TemplateReviewSheet />
        {/if}
      </div>

      {#if changeCount === 0}
        <p class="ui:text-muted-foreground mt-4 text-sm">{$t('course_templates.sync.up_to_date')}</p>
      {:else}
        <Alert.Root variant="information" class="mt-4">
          <Alert.Title>{$t('course_templates.sync.updates_title', { count: changeCount })}</Alert.Title>
          <Alert.Description>{summary}</Alert.Description>
        </Alert.Root>
      {/if}
    {/if}
  </SettingsCard>
{/if}
