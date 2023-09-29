<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { courseInProgress } from '$lib/components/Courses/store';

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(`/courses/${id}`);
  };
</script>

<section class="h-full mt-10 mb-20 xl:mt-2">
  <p class="text-base font-semibold text-[#040F2D] pb-3 dark:text-white">Currently Learning</p>
  <div
    class="flex items-center flex-col border border-[#EAEAEA] dark:bg-neutral-800 gap-2 rounded w-full h-fit xl:h-[516px] p-3"
  >
    {#if $courseInProgress.length > 0}
      <div class="w-full h-full xl:h-[516px] flex flex-col justify-start">
        {#each $courseInProgress as course}
          <div class="p-5">
            <span class="flex flex-col md:flex-row gap-3 items-start pb-5">
              <img
                src={course.logo || '/images/classroomio-course-img-template.jpg'}
                alt="course"
                class="hidden md:block md:w-[60px] md:h-[60px]"
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
                style="width:{course.progress_rate}%"
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
