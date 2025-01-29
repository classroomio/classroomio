<script lang="ts">
  import { goto } from '$app/navigation';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import CourseListModal from '$lib/components/LMS/components/CourseListModal.svelte';
  import { lmsCourses } from '$lib/components/LMS/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courseProgress, getPathwayCompletedCoursesLength } from '$lib/utils/functions/pathway';
  import { t } from '$lib/utils/functions/translations';
  import { ChevronDown } from 'carbon-icons-svelte';

  let open = false;

  // this return the first course it can find in the array that is been taken but not yet completed.
  const getCurrentCourse = (pathway) => {
    return pathway.pathway_course?.find(
      (course) => course.is_unlocked === true && courseProgress(course.course.lesson) != 100
    );
  };

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(`/courses/${id}/lessons?next=true`);
  };

  $: last3Courses = $lmsCourses.length > 0 ? $lmsCourses.slice(0, 3) : [];
</script>

<section class="h-full">
  <p class="pb-3 text-base font-semibold text-[#040F2D] dark:text-white">
    {$t('dashboard.current_lesson')}
  </p>
  <div
    class="flex w-full flex-col items-center gap-2 rounded border border-[#EAEAEA] p-3 dark:bg-neutral-800 lg:h-[40vh]"
  >
    {#if last3Courses.length > 0}
      <div class=" flex h-full w-full flex-col justify-start overflow-y-auto">
        {#each last3Courses as course}
          <div class="p-3">
            {#if course.isPathway}
              <div
                class="org-selector text-primary-900 relative flex items-center justify-between pb-3 text-xs font-bold"
              >
                <span class="uppercase">{$t('lms_pathway.pathway')}: {course.title}</span>
                <button
                  class="flex cursor-pointer items-center gap-2 lowercase"
                  on:click={(e) => {
                    e.stopPropagation();
                    open = !open;
                  }}
                >
                  {getPathwayCompletedCoursesLength(course) || 0}
                  {$t('lms_pathway.of')}
                  {course?.total_course}
                  {$t('lms_pathway.completed')}
                  <ChevronDown />
                </button>
              </div>

              <!-- this is for the current course being taken  -->
              {#if getCurrentCourse(course)}
                <span class="flex flex-col items-start gap-3 pb-5 lg:flex-row">
                  <img
                    src={getCurrentCourse(course)?.course.logo ||
                      '/images/classroomio-course-img-template.jpg'}
                    alt="course"
                    class="hidden lg:block lg:h-[60px] lg:w-[60px]"
                  />
                  <div class="w-full">
                    <p class="text-base font-semibold dark:text-white">
                      {getCurrentCourse(course)?.course.title}
                    </p>
                    <p class="line-clamp-2 text-xs font-normal text-[#656565] dark:text-white">
                      {getCurrentCourse(course)?.course.description}
                    </p>
                  </div>
                  <PrimaryButton
                    label={$t('dashboard.continue')}
                    variant={VARIANTS.OUTLINED}
                    className="rounded-none text-[#0233BD]"
                    onClick={() => gotoCourse(getCurrentCourse(course)?.course.id)}
                  />
                </span>
              {/if}

              <!-- progress bar -->
              {#if getCurrentCourse(course) && courseProgress(getCurrentCourse(course).course.lesson) > 0}
                <div class="relative h-1 w-full bg-[#EAEAEA]">
                  <div style="width: 100%" class={`bg-primary-700 absolute left-0 top-0 h-full`} />
                </div>
              {/if}

              <!-- pathway courses -->
              {#if course.pathway_course}
                <CourseListModal pathway={course} bind:open />
              {/if}

              <!--  -->
            {:else}
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
                </div>
                <PrimaryButton
                  label={$t('dashboard.continue')}
                  variant={VARIANTS.OUTLINED}
                  className="rounded-none text-[#0233BD]"
                  onClick={() => gotoCourse(course.id)}
                />
              </span>
              {#if course?.progress_rate && course?.progress_rate > 0}
                <div class="relative h-1 w-full bg-[#EAEAEA]">
                  <div
                    style="width: {Math.round(
                      ((course?.progress_rate ?? 0) / (course?.total_lessons ?? 0)) * 100
                    ) || 0}%"
                    class={`bg-primary-700 absolute left-0 top-0 h-full`}
                  />
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex flex-col items-center">
        <CoursesEmptyIcon />
        <h3 class="text-center">{$t('dashboard.no_courses')}</h3>
        <p class="w-[75%] text-center">{$t('dashboard.start_course')}</p>
      </div>
    {/if}
  </div>
</section>
