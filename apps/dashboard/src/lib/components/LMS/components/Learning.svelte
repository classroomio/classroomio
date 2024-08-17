<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { ChevronDown } from 'carbon-icons-svelte';
  import CourseListModal from '$lib/components/LMS/components/CourseListModal.svelte';
  import { lmsCourses } from '$lib/components/LMS/store';

  let open = false;

  const getCompletedCoursesCount = (pathway) => {
    return pathway.courses?.filter((course) => course.progress_rate === 100).length || 0;
  };

  // this return the first course it can find in the array that is been taken but not yet completed.
  const getCurrentCourse = (pathway) => {
    return pathway.courses?.find(
      (course) => course.is_unlocked === true && course.progress_rate !== 100
    );
  };

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(`/courses/${id}/lessons?next=true`);
  };

  $: last3Courses = $lmsCourses.length > 0 ? $lmsCourses.slice(0, 3) : [];
</script>

<section class="h-full">
  <p class="text-base font-semibold text-[#040F2D] pb-3 dark:text-white">
    {$t('dashboard.current_lesson')}
  </p>
  <div
    class="flex items-center flex-col border border-[#EAEAEA] dark:bg-neutral-800 gap-2 rounded w-full lg:h-[40vh] p-3"
  >
    {#if last3Courses.length > 0}
      <div class=" w-full h-full flex flex-col justify-start overflow-y-auto">
        {#each last3Courses as course}
          <div class="p-3">
            {#if course.isPathway}
              <div
                class="org-selector relative flex justify-between items-center text-primary-900 font-bold text-xs pb-3"
              >
                <span class="uppercase">{$t('lms_pathway.pathway')}: {course.title}</span>
                <button
                  class="flex gap-2 items-center cursor-pointer lowercase"
                  on:click={(e) => {
                    e.stopPropagation();
                    open = !open;
                  }}
                >
                  {getCompletedCoursesCount(course) || 0}
                  {$t('lms_pathway.of')}
                  {course.courses.length}
                  {$t('lms_pathway.completed')}
                  <ChevronDown />
                </button>
              </div>

              <span class="flex flex-col lg:flex-row gap-3 items-start pb-5">
                <img
                  src={getCurrentCourse(course).logo ||
                    '/images/classroomio-course-img-template.jpg'}
                  alt="course"
                  class="hidden lg:block lg:w-[60px] lg:h-[60px]"
                />
                <div class="w-full">
                  <p class="text-base font-semibold dark:text-white">
                    {getCurrentCourse(course)?.title}
                  </p>
                  <p class="line-clamp-2 text-xs font-normal text-[#656565] dark:text-white">
                    {getCurrentCourse(course)?.description}
                  </p>
                </div>
                <PrimaryButton
                  label={$t('dashboard.continue')}
                  variant={VARIANTS.OUTLINED}
                  className="rounded-none text-[#0233BD]"
                  onClick={() => gotoCourse(getCurrentCourse(course)?.id)}
                />
              </span>
              {#if getCurrentCourse(course)?.progress_rate && getCurrentCourse(course)?.progress_rate > 0}
                <div class="relative bg-[#EAEAEA] w-full h-1">
                  <div
                    style="width: {getCurrentCourse(course)?.progress_rate || 0}%"
                    class={`absolute top-0 left-0 bg-primary-700 h-full`}
                  />
                </div>
              {/if}
              {#if course.courses}
                <CourseListModal pathway={course} bind:open />
              {/if}
            {:else}
              <span class="flex flex-col lg:flex-row gap-3 items-start pb-5">
                <img
                  src={course.logo || '/images/classroomio-course-img-template.jpg'}
                  alt="course"
                  class="hidden lg:block lg:w-[60px] lg:h-[60px]"
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
                <div class="relative bg-[#EAEAEA] w-full h-1">
                  <div
                    style="width: {Math.round(
                      ((course?.progress_rate ?? 0) / (course?.total_lessons ?? 0)) * 100
                    ) || 0}%"
                    class={`absolute top-0 left-0 bg-primary-700 h-full`}
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
