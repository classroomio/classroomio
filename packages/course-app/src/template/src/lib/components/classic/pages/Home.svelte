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
  import { SECTION } from '@/utils/constants/page';

  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const courseSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const instructorSection = $derived(getPageSection($homePage, SECTION.INSTRUCTORS));
  const ctaSection = $derived(getPageSection($homePage, SECTION.CTA));

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
    {@const content = getPageSection($homePage, SECTION.HERO)}
    {#if content?.show}
      <section class="flex h-full items-start justify-center px-6 pb-20 pt-4 md:px-14 lg:pt-10">
        <section class="flex flex-col-reverse items-start gap-10 md:flex-row md:justify-between">
          <div class="w-full space-y-6">
            <p class="w-full text-4xl font-bold xl:w-[90%] xl:text-6xl">
              {content.settings.title}
              <span class="text-[#CE02CE]">
                {content.settings.titleHighlight}
              </span>
            </p>
            <p class="w-full text-[#878787] lg:w-[70%] xl:text-lg">
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
            class="flex max-h-full w-full rounded-md md:h-[300px] md:w-1/2 md:max-w-[800px] lg:w-4/5 xl:h-[500px] xl:w-[800px]"
          >
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings.banner.image ? content.settings.banner.image : banner}
              class="mt-2 h-full w-full rounded-md object-cover md:mt-0"
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
      class="flex h-full items-start justify-center border-b-2 bg-white px-6 pb-20 pt-4 md:px-10 lg:px-14 lg:pt-20"
    >
      <section class="flex flex-col items-center justify-center gap-4 lg:flex-row lg:items-start">
        <div class="w-full space-y-4 lg:w-[60%]">
          <p class="text-4xl font-bold text-[#3F3F3F]">{aboutSection.settings.title}</p>
          <p class="w-full text-base leading-7 text-[#878787] lg:w-[80%]">
            {aboutSection.settings.content}
          </p>
        </div>
        {#if aboutSection.settings.benefits}
          <div class="min-h-fit max-w-[400px]">
            {#each aboutSection.settings.benefits.list as item, index}
              <div
                class="benefit-card mb-9 w-full max-w-[200px] rounded-b-lg border-b-4 border-[#CE02CE] bg-white p-4 text-center font-semibold shadow-lg"
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
            class="max-h-[450px] rounded-2xl"
          />
        {/if}
      </section>
    </section>
  {/if}

  <!-- courses -->
  {#if courseSection?.show}
    <section id="course" class="h-full bg-white px-4 py-6 pb-20">
      <h1 class="mb-4 text-center text-3xl font-bold text-[#3F3F3F]">
        {courseSection.settings.title}
      </h1>
      <div class="mx-auto w-full md:w-[90%]">
        {#if $courses.length > 0}
          <section class="mx-auto flex w-fit flex-wrap items-center gap-4">
            {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
              <CourseCard
                slug={courseData.slug}
                bannerImage={courseData.banner || '/course-banner.jpg'}
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
            <div class="my-5 flex w-full items-center justify-center">
              <PrimaryButton
                class="bg-[#CE02CE] text-lg font-semibold text-white"
                onClick={() => (viewAll = !viewAll)}
                label="View more programs"
              />
            </div>
          {/if}
        {:else}
          <div class="mx-auto w-full px-4 lg:w-[70%]">
            <EmptyState headerClassName="text-[#CE02CE]" />
          </div>
        {/if}
      </div>
    </section>
  {/if}
  <!-- instructors -->
  {#if instructorSection?.show}
    <section class="h-full bg-white px-4 pb-20 pt-4 lg:px-14">
      <div class="mx-auto w-full xl:w-[90%]">
        <h1 class="  mb-4 text-center text-3xl font-bold text-[#3F3F3F] lg:text-start">
          Meet some of our Instructors
        </h1>
        <section class="grid w-full grid-cols-1 place-items-center gap-2 md:grid-cols-2">
          {#each instructorSection.settings.list as item}
            <InstructorCard name={item.name} description={item.description} rating={item.rating} />
          {/each}
        </section>
        <div class="mt-6 flex w-full justify-center px-4 md:justify-end">
          <PrimaryButton
            class="rounded p-6 text-lg font-semibold text-white"
            label="Start learning & Explore courses"
          />
        </div>
      </div>
    </section>
  {/if}
  <!-- faq -->
  {#if faqSection?.show}
    <section class="h-full bg-[#F9F9F9] px-4 py-6 pb-20">
      <h1 class="mb-4 text-center text-3xl font-bold text-[#3F3F3F]">
        {faqSection.settings.title}
      </h1>
      <section class="mx-auto w-full space-y-10 p-2 md:w-[80%]">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </section>
  {/if}
  <!-- testimonial -->
  {#if testimonialSection?.show}
    <section id="testimonial" class="h-full bg-white px-4 pb-20 pt-4 lg:px-14">
      <h1 class="mb-4 text-center text-3xl font-bold text-[#3F3F3F]">
        Words from our past learners
      </h1>
      <section class="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each testimonialSection.settings.list as item}
          <TestimonialCard description={item.description} name={item.name} />
        {/each}
      </section>
    </section>
  {/if}
  <!-- footerNote -->
  {#if ctaSection?.show}
    <section class="bg-classic flex flex-col items-center justify-between px-6 py-20 lg:px-10">
      <div class="flex w-full items-center justify-center">
        <p class="w-full text-center text-4xl font-bold text-white">
          {ctaSection.settings.title}
        </p>
      </div>
      <div class="my-5 flex w-full items-center justify-center">
        <PrimaryButton
          onClick={() => goto(ctaSection.settings?.button?.link)}
          class="bg-classic-secondary hover:bg-classic-secondary rounded-sm border border-gray-100 text-lg font-bold hover:scale-95"
          label={ctaSection.settings?.button?.label}
        />
      </div>
    </section>
  {/if}

  <!-- blog -->
  <section id="course" class="h-full bg-white px-4 py-6 pb-20">
    <h1 class="mb-4 text-center text-3xl font-bold text-[#3F3F3F]">Latest blog Post</h1>
    <section class="mx-auto flex w-full flex-wrap items-center gap-2">
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
