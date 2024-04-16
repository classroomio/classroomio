<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { coursesInProgress } from '$lib/components/Courses/store';

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(`/courses/${id}/lessons?next=true`);
  };
</script>

<section class="h-full">
  <p class="text-base font-semibold text-[#040F2D] pb-3 dark:text-white">Currently Learning</p>
  <div
    class="flex items-center flex-col border border-[#EAEAEA] dark:bg-neutral-800 gap-2 rounded w-full lg:h-[40vh] p-3"
  >
    {#if $coursesInProgress.length > 0}
      <div class="w-full h-full flex flex-col justify-start overflow-y-auto">
        {#each $coursesInProgress as course}
          <div class="p-5">
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
                label="Continue"
                variant={VARIANTS.OUTLINED}
                className="rounded-none text-[#0233BD]"
                onClick={() => gotoCourse(course.id)}
              />
            </span>
            <div class="relative bg-[#EAEAEA] w-full h-1">
              <div
                style="width: {Math.round(
                  ((course?.progress_rate ?? 0) / (course?.total_lessons ?? 0)) * 100
                ) || 0}%"
                class={`absolute top-0 left-0 bg-primary-700 h-full`}
              />
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex flex-col items-center">
        <CoursesEmptyIcon />
        <h3 class="text-center">No courses in progress yet</h3>
        <p class="w-[75%] text-center">Once you start a course, your progress will reflect here</p>
      </div>
    {/if}
  </div>
</section>
