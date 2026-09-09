<script lang="ts">
  import { AnalyticsPage } from '$features/course/pages';
  import { ExportMenu, RefreshPageData } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { buildCourseAnalyticsExportDocument } from '$features/course/utils/course-analytics-export-utils';

  let { data } = $props();

  const exportDocument = $derived(
    data.courseAnalytics
      ? buildCourseAnalyticsExportDocument(data.courseAnalytics, courseApi.course?.title || 'Course', {
          name: $t('audience.name'),
          email: $t('audience.email'),
          lessonsCompleted: $t('analytics.lessons_completed'),
          lessons: $t('course.navItem.lessons.title'),
          exercisesSubmitted: $t('analytics.exercises_completed'),
          exercises: $t('analytics.exercises'),
          progress: $t('analytics.progress'),
          averageGrade: $t('analytics.total_average_grade'),
          lastSeen: $t('audience.filter.last_activity')
        })
      : null
  );
</script>

<Page.Root class="max-auto w-[90%] px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('analytics.title')}
      </Page.Title>
      <p class="ui:text-muted-foreground text-sm">{$t('analytics.course_metrics.page_subtitle')}</p>
    </Page.HeaderContent>
    <Page.Action>
      {#if exportDocument}
        <ExportMenu
          document={exportDocument}
          estimatedRowCount={exportDocument.rows.length}
          disabled={exportDocument.rows.length === 0}
          testId="course-analytics-export"
        />
      {/if}
      <RefreshPageData />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AnalyticsPage courseAnalytics={data.courseAnalytics} />
    {/snippet}
  </Page.Body>
</Page.Root>
