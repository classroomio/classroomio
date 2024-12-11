<script lang="ts">
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import { courses } from '@/utils/stores/course';
  import PrimaryButton from './PrimaryButton.svelte';

  const content = $derived(getPageSection($homePage, 'courses'));

  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };
  let viewAll = $state(false);
  let type = DISPLAY_COURSE.ALL;
</script>

{#if content?.show}
  <section id="course" class="px-4 py-6 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">{content.settings.title}</h1>
    <div class="w-full md:w-[90%] mx-auto">
      {#if $courses.length > 0}
        <section class="flex flex-wrap items-center mx-auto w-fit gap-4">
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              slug={courseData.slug}
              bannerImage={courseData.banner || '/classroomio-course-img-template.jpg'}
              title={courseData.title}
              type={courseData.type}
              description={courseData.description}
              cost={courseData.cost}
              currency={courseData.currency}
              totalLessons={courseData.lessonsCount}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <PrimaryButton
              class="text-lg font-semibold text-white bg-[#CE02CE]"
              onClick={() => (viewAll = !viewAll)}
              label="View more programs"
            />
          </div>
        {/if}
      {:else}
        <div class="px-4 w-full lg:w-[70%] mx-auto">
          <EmptyState headerClassName="text-[#CE02CE]" />
        </div>
      {/if}
    </div>
  </section>
{/if}
