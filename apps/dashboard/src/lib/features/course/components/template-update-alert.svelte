<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Alert from '@cio/ui/base/alert';
  import { courseApi, courseTemplateApi } from '$features/course/api';
  import { formatTemplateUsedDate } from '$features/course/utils/template-display';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { resolve } from '$app/paths';

  const course = $derived(courseApi.course);
  const updates = $derived(
    course && courseTemplateApi.updatesCourseId === course.id ? courseTemplateApi.updates : null
  );
  const changeCount = $derived((updates?.units.length ?? 0) + (updates?.settings.length ?? 0));
  const showAlert = $derived(
    Boolean(
      $isOrgAdmin &&
        course?.templateId &&
        !course.isTemplate &&
        updates?.template &&
        !updates.template.deleted &&
        changeCount > 0
    )
  );

  $effect(() => {
    const current = courseApi.course;
    if (!current?.id || !current.templateId || current.isTemplate || !$isOrgAdmin) return;

    void courseTemplateApi.loadUpdates(current.id);
  });
</script>

{#if showAlert && updates?.template}
  <Alert.Root variant="information" class="mb-5">
    <InfoIcon />
    <Alert.Title>{$t('course_templates.sync.alert_title', { count: changeCount })}</Alert.Title>
    <Alert.Description>
      {$t('course_templates.sync.alert_body', {
        title: updates.template.title,
        date: formatTemplateUsedDate(updates.lastPulledAt ?? '')
      })}
      <a class="ui:text-primary ml-1 underline" href="{resolve(`/courses/${course?.id}/settings`, {})}#template">
        {$t('course_templates.sync.review_in_settings')}
      </a>
    </Alert.Description>
  </Alert.Root>
{/if}
