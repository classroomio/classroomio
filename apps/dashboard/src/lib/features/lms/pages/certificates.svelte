<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import { CourseCardList, CourseCardLoader } from '$features/course/components';
  import { coursesApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { UserEnrolledCourses } from '$features/course/types';

  let searchValue = $state('');

  const earnedCertificates = $derived.by(() => {
    const courses = coursesApi.enrolledCourses.filter((course) => course.certificateEarnedAt != null);

    return [...courses].sort((leftCourse, rightCourse) => {
      const leftDate = leftCourse.certificateEarnedAt ? new Date(leftCourse.certificateEarnedAt).getTime() : 0;
      const rightDate = rightCourse.certificateEarnedAt ? new Date(rightCourse.certificateEarnedAt).getTime() : 0;

      return rightDate - leftDate;
    });
  });

  const filteredCertificates = $derived.by(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return earnedCertificates;
    }

    return earnedCertificates.filter((course) => {
      const title = course.title?.toLowerCase() ?? '';
      const description = course.description?.toLowerCase() ?? '';

      return title.includes(query) || description.includes(query);
    });
  });

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    coursesApi.getEnrolledCourses();
  });
</script>

<div class="space-y-4">
  <Search bind:value={searchValue} placeholder={$t('certificates.search')} />

  {#if coursesApi.isLoading}
    <section class="cards-container">
      <CourseCardLoader />
      <CourseCardLoader />
      <CourseCardLoader />
    </section>
  {:else if filteredCertificates.length === 0}
    <Empty
      title={searchValue.trim() ? $t('certificates.no_results_title') : $t('certificates.empty_title')}
      description={searchValue.trim()
        ? $t('certificates.no_results_description')
        : $t('certificates.empty_description')}
    >
      {#if !searchValue.trim()}
        <Button href="/lms/mylearning">{$t('certificates.go_to_my_learning')}</Button>
      {/if}
    </Empty>
  {:else}
    <CourseCardList courses={filteredCertificates as UserEnrolledCourses} isLMS={true} isCertificateView={true} />
  {/if}
</div>
