<script lang="ts">
  import { UserAnalyticsPage } from '$features/audience/pages';
  import { BackButton } from '@cio/ui';
  import { ExportMenu } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { buildUserAnalyticsExportDocument } from '$features/audience/utils/user-analytics-export-utils';

  let { data } = $props();

  const exportDocument = $derived(
    data.analytics
      ? buildUserAnalyticsExportDocument(data.analytics, {
          course: $t('analytics.courses'),
          lessonsCompleted: $t('analytics.lessons_completed'),
          lessons: $t('course.navItem.lessons.title'),
          exercisesCompleted: $t('analytics.exercises_completed'),
          exercises: $t('analytics.exercises'),
          progress: $t('analytics.progress'),
          averageGrade: $t('analytics.total_average_grade')
        })
      : null
  );
</script>

<svelte:head>
  <title>{t.get('audience.user_analytics.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-5xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={`${$currentOrgPath}/audience`} label={$t('community.ask.go_back')} />
      <Page.Title>{$t('audience.user_analytics.title')}</Page.Title>
      <Page.Subtitle>{$t('audience.user_analytics.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      {#if exportDocument}
        <ExportMenu
          document={exportDocument}
          estimatedRowCount={exportDocument.rows.length}
          disabled={exportDocument.rows.length === 0}
          testId="user-analytics-export"
        />
      {/if}
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <UserAnalyticsPage {data} />
    {/snippet}
  </Page.Body>
</Page.Root>
