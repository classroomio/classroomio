<script lang="ts">
  import { courseApi } from '$features/course/api';
  import { getCourseContent } from '$features/course/utils/content';
  import { contentRequirements } from '$features/course/utils/content-requirement-store';
  import { countRequirements } from '$features/course/utils/content-requirement-utils';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';

  const contentData = $derived(getCourseContent(courseApi.course));
  const contentItems = $derived(
    contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items
  );
  const counts = $derived(countRequirements(contentItems, $contentRequirements));
  const progressPercent = $derived(counts.required ? (counts.requiredDone / counts.required) * 100 : 0);
  const remaining = $derived(counts.required - counts.requiredDone);
</script>

{#if counts.total > 0}
  <div
    class="mx-auto mb-3 w-full max-w-xl rounded-md bg-gray-100 px-3 py-2 text-sm dark:bg-neutral-700"
    data-testid="lessons-requirement-summary"
  >
    {#if $isOrgStudent === true}
      <div class="flex items-center justify-between gap-2">
        <span>{$t('course.navItem.lessons.requirement.progress_label')}</span>
        <strong class="tabular-nums">
          {$t('course.navItem.lessons.requirement.progress_value', {
            done: counts.requiredDone,
            total: counts.required
          })}
        </strong>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-600">
        <div class="h-full rounded-full bg-green-600 transition-all" style="width: {progressPercent}%"></div>
      </div>
      <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-300">
        {remaining === 0
          ? $t('course.navItem.lessons.requirement.progress_done')
          : $t('course.navItem.lessons.requirement.progress_remaining', { count: remaining })}
      </p>
    {:else}
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 dark:text-gray-300">
        <span>{$t('course.navItem.lessons.requirement.count_required', { count: counts.required })}</span>
        <span>{$t('course.navItem.lessons.requirement.count_optional', { count: counts.optional })}</span>
      </div>
    {/if}
  </div>
{/if}
