<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courses } from '$lib/features/course/utils/store';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';

  const gotoCourse = (id: string | undefined) => {
    if (!id) return;
    goto(`/courses/${id}/lessons?next=true`);
  };

  let last3Courses = $derived($courses.length > 0 ? $courses.slice(0, 3) : []);
</script>

<section class="h-full">
  <p class="pb-3 text-base font-semibold text-[#040F2D] dark:text-white">
    {$t('dashboard.current_lesson')}
  </p>
  <div
    class="flex w-full flex-col items-center gap-2 rounded border border-[#EAEAEA] p-3 lg:h-[40vh] dark:bg-neutral-800"
  >
    {#if last3Courses.length > 0}
      <div class="flex h-full w-full flex-col justify-start overflow-y-auto">
        {#each last3Courses as course}
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
              </div>
              <PrimaryButton
                label={$t('dashboard.continue')}
                variant={VARIANTS.OUTLINED}
                className="rounded-none text-[#0233BD]"
                onClick={() => gotoCourse(course.id)}
              />
            </span>
            <div class="relative h-1 w-full bg-[#EAEAEA]">
              <div
                style="width: {Math.round(((course?.progress_rate ?? 0) / (course?.total_lessons ?? 0)) * 100) || 0}%"
                class="bg-primary-700 absolute left-0 top-0 h-full"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <Empty title={$t('dashboard.no_courses')} description={$t('dashboard.start_course')} icon={BookOpenIcon} />
    {/if}
  </div>
</section>
