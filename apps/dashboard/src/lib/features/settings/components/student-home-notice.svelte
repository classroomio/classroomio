<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Alert from '@cio/ui/base/alert';
  import InfoIcon from '@lucide/svelte/icons/info';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { studentHomeApi } from '$features/org/api/student-home.svelte';
  import { toLmsAvailabilityContext } from '$features/ui/navigation/lms-navigation';
  import { buildStudentHomePageOptions, toStudentHomeDestination } from '$features/org/utils/student-home-utils';

  const destination = $derived(toStudentHomeDestination($currentOrg));
  const pageOptions = $derived(buildStudentHomePageOptions((key) => t.get(key), toLmsAvailabilityContext($currentOrg)));
  const courses = $derived(studentHomeApi.courses);

  let coursesListedOrgId = $state('');

  $effect(() => {
    const organizationId = $currentOrg?.id;
    if (!organizationId || organizationId === coursesListedOrgId) return;

    coursesListedOrgId = organizationId;
    const savedHome = toStudentHomeDestination($currentOrg);

    if (savedHome?.type === 'course') {
      void studentHomeApi.listCourses({ includeCourseId: savedHome.courseId });
    }
  });

  const destinationLabel = $derived.by(() => {
    if (!destination) return null;

    if (destination.type === 'page') {
      return pageOptions.find((option) => option.key === destination.key)?.label ?? null;
    }

    return courses?.find((course) => course.id === destination.courseId)?.title ?? null;
  });
</script>

{#if destination && destinationLabel}
  <Alert.Root variant="information">
    <InfoIcon />
    <Alert.Description>
      {$t('components.settings.landing_page.student_home_notice.notice', {
        destination: destinationLabel
      })}
      <a class="ui:text-primary ml-1 underline" href={resolve(`${$currentOrgPath}/settings/customize-lms`, {})}>
        {$t('components.settings.landing_page.student_home_notice.change')}
      </a>
    </Alert.Description>
  </Alert.Root>
{/if}
