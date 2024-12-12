<script lang="ts">
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { goto } from '$app/navigation';
  import banner from '../assets/org-banner.png';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import InstructorCard from '../InstructorsCard.svelte';
  import Accordion from '../Accordion.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';
  import BlogCard from '../BlogCard.svelte';

  const faqSection = $derived(getPageSection($homePage, 'faq'));
  const testimonialSection = $derived(getPageSection($homePage, 'testimonial'));
  const aboutSection = $derived(getPageSection($homePage, 'about'));
  const courseSection = $derived(getPageSection($homePage, 'courses'));
  const instructorSection = $derived(getPageSection($homePage, 'instructors'));
  const footerNoteSection = $derived(getPageSection($homePage, 'cta'));

  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };
  let viewAll = $state(false);
  let type = DISPLAY_COURSE.ALL;
</script>

<main>
  <!-- <Hero /> -->
  {#if $homePage}
    {@const content = getPageSection($homePage, 'header')}
    {#if content?.show}
      <section class="flex items-start justify-center pb-20 lg:pt-10 pt-4 px-6 md:px-14 h-full">
        <section class="flex flex-col-reverse md:flex-row items-start gap-10 md:justify-between">
          <div class="space-y-6 w-full">
            <p class="text-4xl xl:text-6xl font-bold w-full xl:w-[90%]">
              {content.settings.title}
              <span class="text-[#CE02CE]">
                {content.settings.titleHighlight}
              </span>
            </p>
            <p class="w-full lg:w-[70%] text-[#878787] xl:text-lg">
              {content.settings.subtitle}
            </p>
            <PrimaryButton
              onClick={() => {
                goto(content.settings.action.link);
              }}
              label={content.settings.action.label}
            />
          </div>
          <div
            class="rounded-md md:h-[300px] xl:h-[500px] max-h-full w-full md:w-1/2 lg:w-4/5 xl:w-[800px] md:max-w-[800px] flex"
          >
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings.banner.image ? content.settings.banner.image : banner}
              class="object-cover mt-2 h-full w-full rounded-md md:mt-0"
            />
          </div>
        </section>
      </section>
    {/if}
  {/if}

  <!-- about -->

  {#if aboutSection?.show}
    <section
      id="about"
      class="flex items-start justify-center px-6 md:px-10 lg:px-14 h-full bg-white border-b-2 pb-20 lg:pt-20 pt-4"
    >
      <section class="flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
        <div class="w-full lg:w-[60%] space-y-4">
          <p class="text-4xl font-bold text-[#3F3F3F]">{aboutSection.settings.title}</p>
          <p class="w-full lg:w-[80%] text-base leading-7 text-[#878787]">
            {aboutSection.settings.content}
          </p>
        </div>
        {#if aboutSection.settings.benefits}
          <div class="max-w-[400px] min-h-fit">
            {#each aboutSection.settings.benefits.list as item, index}
              <div
                class="benefit-card w-full text-center max-w-[200px] p-4 font-semibold mb-9 border-b-4 border-[#CE02CE] bg-white rounded-b-lg shadow-lg"
                class:left={index % 2 === 0}
                class:right={index % 2 !== 0}
              >
                {item.title}
              </div>
            {/each}
          </div>
        {:else}
          <img
            src={aboutSection.settings.imageUrl}
            alt="Our Story"
            class="rounded-2xl max-h-[450px]"
          />
        {/if}
      </section>
    </section>
  {/if}

  <!-- courses -->
  {#if courseSection?.show}
    <section id="course" class="px-4 py-6 pb-20 h-full bg-white">
      <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">
        {courseSection.settings.title}
      </h1>
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
  <!-- instructors -->
  {#if instructorSection?.show}
    <section class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
      <div class="w-full xl:w-[90%] mx-auto">
        <h1 class="  text-center lg:text-start text-3xl text-[#3F3F3F] font-bold mb-4">
          Meet some of our Instructors
        </h1>
        <section class="grid place-items-center grid-cols-1 md:grid-cols-2 gap-2 w-full">
          {#each instructorSection.settings.list as item}
            <InstructorCard name={item.name} description={item.description} rating={item.rating} />
          {/each}
        </section>
        <div class="w-full flex justify-center md:justify-end px-4 mt-6">
          <PrimaryButton
            class="text-lg font-semibold text-white p-6 rounded"
            label="Start learning & Explore courses"
          />
        </div>
      </div>
    </section>
  {/if}
  <!-- faq -->
  {#if faqSection?.show}
    <section class="px-4 py-6 pb-20 h-full bg-[#F9F9F9]">
      <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">
        {faqSection.settings.title}
      </h1>
      <section class="p-2 space-y-10 w-full md:w-[80%] mx-auto">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </section>
  {/if}
  <!-- testimonial -->
  {#if testimonialSection?.show}
    <section id="testimonial" class="px-4 lg:px-14 pt-4 pb-20 h-full bg-white">
      <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">
        Words from our past learners
      </h1>
      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
        {#each testimonialSection.settings.list as item}
          <TestimonialCard description={item.description} name={item.name} />
        {/each}
      </section>
    </section>
  {/if}
  <!-- footerNote -->
  {#if footerNoteSection?.show}
    <section class="flex flex-col items-center justify-between px-6 lg:px-10 py-20 bg-classic">
      <div class="flex items-center justify-center w-full">
        <p class="text-4xl text-white text-center font-bold w-full">
          {footerNoteSection.settings.title}
        </p>
      </div>
      <div class="w-full flex items-center justify-center my-5">
        <PrimaryButton
          onClick={() => goto('/courses')}
          class="rounded-sm font-bold text-lg bg-classic-secondary border hover:scale-95 hover:bg-classic-secondary border-gray-100"
          label={footerNoteSection.settings.buttonLabel}
        />
      </div>
    </section>
  {/if}

  <!-- blog -->
  <section id="course" class="px-4 py-6 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">Latest blog Post</h1>
    <section class="flex flex-wrap items-center mx-auto gap-2 w-full">
      <BlogCard />
      <BlogCard />
      <BlogCard />
      <BlogCard />
    </section>
  </section>
</main>

<style>
  .benefit-card {
    transition: transform 0.3s ease-in-out;
    position: relative;
  }
  .benefit-card.left {
    float: left;
    margin-left: 6%;
    z-index: 2;
  }
  .benefit-card.right {
    float: right;
    margin-right: 6%;
    z-index: 1;
  }
  /* Make sure the cards overlap slightly */
  .benefit-card:not(:first-child) {
    margin-top: -40px; /* Adjust this for more overlap */
  }
</style>
