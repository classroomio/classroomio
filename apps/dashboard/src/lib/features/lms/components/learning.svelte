<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import { coursesApi } from '$features/course/api';
  import {
    getStudentCourseComplianceDate,
    getStudentCourseComplianceStatusKey,
    getStudentCourseComplianceStatusVariant,
    getStudentCourseProgressPercent
  } from '$features/course/utils/compliance-utils';
  import { getStudentCourseContinuePath } from '$features/course/utils/student-course-navigation';

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(getStudentCourseContinuePath(id));
  };

  let highlightedCourses = $derived.by(() => {
    const courses = [...coursesApi.enrolledCourses];

    return courses
      .sort((leftCourse, rightCourse) => {
        const leftComplianceDate = getStudentCourseComplianceDate(leftCourse)?.value;
        const rightComplianceDate = getStudentCourseComplianceDate(rightCourse)?.value;
        const leftTimestamp = leftComplianceDate ? new Date(leftComplianceDate).getTime() : Number.POSITIVE_INFINITY;
        const rightTimestamp = rightComplianceDate ? new Date(rightComplianceDate).getTime() : Number.POSITIVE_INFINITY;

        return leftTimestamp - rightTimestamp;
      })
      .slice(0, 3);
  });

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium'
    }).format(date);
  }
</script>

<section class="h-full">
  <p class="pb-3 text-base font-semibold text-[#040F2D] dark:text-white">
    {$t('dashboard.current_lesson')}
  </p>
  <div
    class="flex w-full flex-col items-center gap-2 rounded border border-[#EAEAEA] p-3 lg:h-[40vh] dark:bg-neutral-800"
  >
    {#if highlightedCourses.length > 0}
      <div class="flex h-full w-full flex-col justify-start overflow-y-auto">
        {#each highlightedCourses as course}
          <div class="p-5">
            <span class="flex flex-col items-start gap-3 pb-5 lg:flex-row">
              <img
                src={course.logo || '/images/classroomio-course-img-template.jpg'}
                alt="course"
                class="hidden lg:block lg:h-[60px] lg:w-[60px]"
              />
              <div class="w-full">
                <p class="text-base font-semibold dark:text-white">{course.title}</p>
                <p class="line-clamp-2 text-xs font-normal text-[#656565] dark:text-white">
                  {course.description}
                </p>

                {#if course.type === 'COMPLIANCE'}
                  {@const complianceStatusKey = getStudentCourseComplianceStatusKey(course)}
                  {@const complianceDate = getStudentCourseComplianceDate(course)}
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    {#if complianceStatusKey}
                      <Badge variant={getStudentCourseComplianceStatusVariant(course)}>
                        {$t(complianceStatusKey)}
                      </Badge>
                    {/if}

                    {#if complianceDate?.value}
                      <p class="ui:text-muted-foreground text-xs dark:text-white">
                        {$t(complianceDate.labelKey)}: {formatDate(complianceDate.value)}
                      </p>
                    {/if}
                  </div>
                {/if}
              </div>
              <Button variant="outline" onclick={() => gotoCourse(course.id)}>
                {$t('dashboard.continue')}
              </Button>
            </span>
            <Progress value={getStudentCourseProgressPercent(course)} max={100} class="ui:h-1" />
          </div>
        {/each}
      </div>
    {:else}
      <Empty title={$t('dashboard.no_courses')} description={$t('dashboard.start_course')} icon={BookOpenIcon} />
    {/if}
  </div>
</section>
