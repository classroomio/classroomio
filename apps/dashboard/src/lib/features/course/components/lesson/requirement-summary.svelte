<script lang="ts">
  import { courseApi } from '$features/course/api';
  import { getCourseContent } from '$features/course/utils/content';
  import { countRequirements } from '$features/course/utils/content-requirement-utils';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';

  const contentData = $derived(getCourseContent(courseApi.course));
  const contentItems = $derived(
    contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items
  );
  const counts = $derived(countRequirements(contentItems));
  const summary = $derived(
    $isOrgStudent === true
      ? $t('course.navItem.lessons.requirement.progress_summary', {
          done: counts.requiredDone,
          total: counts.required
        })
      : $t('course.navItem.lessons.requirement.teacher_summary', {
          required: counts.required,
          optional: counts.optional
        })
  );
</script>

{#if counts.total > 0}
  <p
    class="mx-auto mb-2 w-full max-w-xl px-1 text-sm text-gray-500 tabular-nums dark:text-gray-300"
    data-testid="lessons-requirement-summary"
  >
    {summary}
  </p>
{/if}
