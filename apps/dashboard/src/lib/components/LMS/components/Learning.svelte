<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { courses } from '$lib/components/Courses/store';
  import { t } from '$lib/utils/functions/translations';
  import { ChevronDown } from 'carbon-icons-svelte';
  import CourseListModal from '$lib/components/LMS/components/CourseListModal.svelte';

  export let isLearningPath = true;
  let open = false;
  const mockPathway = {
    title: 'Become a ux expert',
    courses: [
      { title: 'Intrduction to UX', course_progress: 40, isLocked: false },
      { title: 'Hierarchy patterns', course_progress: 100, isLocked: false },
      { title: 'Alignment and colour schemes', course_progress: 0, isLocked: true },
      { title: 'Advanced design patterns', course_progress: 100, isLocked: false },
      { title: 'Design sytems and patterns', course_progress: 40, isLocked: false }
    ]
  };

  const completedCourse = mockPathway.courses.filter(
    (course) => course.course_progress === 100
  ).length;

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(`/courses/${id}/lessons?next=true`);
  };

  $: last3Courses = $courses.length > 0 ? $courses.slice(0, 3) : [];
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
            {#if isLearningPath}
              <div
                class="org-selector relative flex justify-between items-center text-primary-900 font-bold text-xs pb-3"
              >
                <span class="uppercase">PATHWAY: {mockPathway.title}</span>
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <span
                  class="flex gap-2 items-center cursor-pointer"
                  on:click={(e) => {
                    e.stopPropagation();
                    open = !open;
                  }}
                  >{completedCourse} of {mockPathway.courses.length} courses completed
                  <ChevronDown />
                </span>
              </div>
              <CourseListModal {mockPathway} bind:open />
            {/if}

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
