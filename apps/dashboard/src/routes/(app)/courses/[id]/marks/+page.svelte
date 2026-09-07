<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { MarksPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { AccountOrg } from '$features/app/types';
  import { currentOrg } from '$lib/utils/store/org';
  import { courseApi } from '$features/course/api';
  import { buildMarksExportDocument } from '$features/course/utils/marks-utils';
  import { ExportMenu, RefreshPageData } from '$features/ui';

  let { data } = $props();

  const exercises = $derived(data.marksData?.exercises ?? []);

  // Built from the shared export model, so CSV and PDF come from one column
  // definition rather than two hand-maintained generators.
  const exportDocument = $derived(
    buildMarksExportDocument(
      data.marksData?.students ?? [],
      exercises,
      data.marksData?.studentMarksByExerciseId ?? {},
      courseApi.course?.title || 'Course',
      {
        name: $t('audience.name'),
        email: $t('audience.email'),
        averageGrade: $t('course.navItem.marks.avg_grade')
      }
    )
  );

  function getPageRoles(org: AccountOrg) {
    const roles = [1, 2];
    if (org.customization?.course?.grading) {
      roles.push(3);
    }
    return roles;
  }
</script>

<RoleBasedSecurity
  allowedRoles={getPageRoles($currentOrg)}
  onDenied={() => {
    goto(resolve(`/courses/${data.courseId}/lessons?next=true`, {}));
  }}
>
  <Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>
          {$t('course.navItem.marks.title')}
        </Page.Title>
      </Page.HeaderContent>
      <Page.Action>
        <div class="flex w-full justify-end gap-2">
          <RoleBasedSecurity allowedRoles={[1, 2]}>
            <ExportMenu
              document={exportDocument}
              estimatedRowCount={exportDocument.rows.length}
              disabled={!data.marksData}
              testId="marks-export"
            />
          </RoleBasedSecurity>
          <RefreshPageData />
        </div>
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <MarksPage marksData={data.marksData} />
      {/snippet}
    </Page.Body>
  </Page.Root>
</RoleBasedSecurity>
