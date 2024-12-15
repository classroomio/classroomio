<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from '../PrimaryButton.svelte';
  import Button from '@/components/ui/button/button.svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { courses } from '$lib/utils/stores/course';
  import { CheckmarkFilled } from 'carbon-icons-svelte';
  import Accordion from '../Accordion.svelte';
  import bannerImg from '../assets/banner.jpeg';
  import { SECTION } from '@/utils/constants/page';

  /**
   * State
   */
  // let coursesList = [1, 2, 3, 4, 5, 6, 7];
  let scrollContainer: HTMLElement | undefined = $state();

  /**
   * Constants
   */
  const coursesSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));
  const footerNoteSection = $derived(getPageSection($homePage, SECTION.FOOTERNOTE));

  /**
   * Functions
   */
  function scrollLeft() {
    scrollContainer?.scrollBy({ left: -300, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer?.scrollBy({ left: 300, behavior: 'smooth' });
  }
</script>

<!-- hero -->
{#if $homePage}
  {@const content = getPageSection($homePage, SECTION.HERO)}
  {#if content?.show}
    <section
      class="font-matter flex h-full items-start justify-center bg-[#F4F4F4] px-5 py-10 md:items-center lg:px-20 lg:py-20"
    >
      <section
        class="flex flex-col-reverse items-center justify-center lg:flex-row lg:justify-between"
      >
        <div class="mt-4 w-full space-y-6 text-center lg:mt-0 lg:text-start">
          <div
            class="mx-auto w-fit rounded-sm border-black bg-[#E5E7E0] px-4 py-1 md:border-b lg:mx-0"
          >
            <p class="text-xs font-bold uppercase text-[#0F163F] lg:text-base">
              {content.settings.title}
            </p>
          </div>
          <p
            class="mx-auto w-full text-4xl font-black capitalize md:w-[90%] md:text-6xl lg:mx-0 lg:w-[80%]"
          >
            {content.settings.titleHighlight}
          </p>
          <p class="mx-auto w-full text-xl font-semibold md:w-[80%] lg:mx-0 lg:w-[70%]">
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
          class="relative flex h-[250px] w-[250px] items-center justify-center lg:h-[350px] lg:w-[500px]"
        >
          <svg
            class="absolute -left-[15px] h-[270px] w-[270px] lg:-left-[60px] lg:h-[370px] lg:w-[400px] xl:-left-[100px] xl:w-[520px]"
            viewBox="0 0 360 360"
          >
            <circle
              cx="180"
              cy="180"
              r="170"
              fill="none"
              stroke="#282828"
              stroke-width="2"
              stroke-dasharray="15, 10"
            />
          </svg>
          <img
            alt="landing page banner"
            src={content.settings.banner?.image ?? bannerImg}
            class="h-[250px] w-[250px] rounded-full object-cover lg:h-[350px] lg:w-[500px]"
          />
        </div>
      </section>
    </section>
  {/if}
{/if}

<!-- courses -->
{#if coursesSection?.show}
  <section id="course" class="flex h-full items-center bg-[#E5E7E0] px-2 py-12 md:px-8">
    <div class="mx-auto w-full rounded-3xl bg-black py-8 text-white lg:w-[90%]">
      <div
        class="flex flex-col items-center justify-center gap-2 px-4 md:flex-row md:items-start md:justify-between lg:px-8"
      >
        <h1
          class="mb-2 w-full text-start text-2xl font-bold text-white md:w-[80%] md:text-3xl lg:w-[60%] lg:text-5xl"
        >
          {coursesSection.settings.title}
        </h1>

        <div class="hidden items-center gap-2 md:flex">
          <button
            class="flex w-fit items-center justify-center rounded-full border border-white bg-transparent p-2 hover:bg-white hover:text-black"
            onclick={scrollLeft}
          >
            <ArrowLeft />
          </button>
          <button
            class="flex w-fit items-center justify-center rounded-full border border-white bg-transparent p-2 hover:bg-white hover:text-black"
            onclick={scrollRight}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      <div class="w-full overflow-x-hidden pl-4 md:pl-8">
        {#if $courses.length > 0}
          <section
            bind:this={scrollContainer}
            class="scrollbar-hide flex w-full items-center gap-4 overflow-x-auto py-4 pr-2"
          >
            {#each $courses as course}
              <CourseCard
                slug={course.slug}
                title={course.title}
                bannerImage={course.banner}
                description={course.description}
              />
            {/each}

            <!-- uncomment this to see try the course carousel -->

            <!-- {#each coursesList as courseData}
              <CourseCard
                slug="Patterns"
                title="Introduction to patterns"
                bannerImage=""
                description="This is an introduction to patterns in UIUX designs, it teaches the fundamental concepts about patterns and other intrinsic details"
              />
            {/each} -->
          </section>
        {:else}
          <div class="mx-auto w-full">
            <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
          </div>
        {/if}
      </div>

      <div class="flex w-full items-center justify-center pt-4">
        <Button
          class="rounded-2xl border-[1.5px] border-white bg-transparent px-10 py-6 uppercase text-white shadow-[-1px_3px_#FFFFFF]"
          href="/courses"
        >
          Explore courses
        </Button>
      </div>
    </div>
  </section>
{/if}
<!-- about -->
{#if aboutSection?.show}
  <section id="about">
    <div class="relative mx-auto h-full w-full px-4 py-10 md:px-10 xl:w-[80%]">
      <h1 class="mx-auto mb-2 text-center text-5xl font-bold md:w-[60%]">
        {aboutSection.settings.title}
      </h1>
      <p class="mx-auto mb-8 text-center text-lg font-semibold dark:text-white md:w-[70%]">
        {aboutSection.settings.subtitle}
      </p>
      <div>
        <section class="flex w-full flex-wrap items-start justify-center gap-6 py-4">
          {#each aboutSection.settings.benefits.list as item}
            <div
              class="flex h-[130px] max-h-[180px] w-full max-w-full flex-col gap-2 overflow-hidden rounded-lg border border-[#282828] bg-white p-4 md:max-w-[320px] lg:max-w-[450px]"
            >
              <span class="flex items-center gap-2">
                <CheckmarkFilled size={24} />
                <p class="line-clamp-1 text-lg capitalize">{item.title}</p>
              </span>
              <p class="line-clamp-3 text-sm text-[#878787]">{item.subtitle}</p>
            </div>
          {/each}
        </section>
      </div>
    </div>
  </section>
{/if}

<!-- faq -->
{#if faqSection?.show}
  <section id="faq" class="relative h-full px-2 pb-20 pt-4">
    <div class="absolute inset-0 bg-[#E5E7E0] opacity-60"></div>

    <div class="relative">
      <h1 class="mb-4 text-center text-5xl font-bold">
        {faqSection.settings.title}
      </h1>
      <h1 class="mx-auto mb-4 w-full text-center text-lg font-semibold md:w-[80%] lg:w-[60%]">
        {faqSection.settings.subtitle}
      </h1>
      <section class="mx-auto w-full space-y-10 px-2 py-4 md:w-[80%]">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </div>
  </section>
{/if}

<!-- testimonial -->
{#if testimonialSection?.show}
  <section id="testimonial" class="h-fit bg-[#F4F4F4] px-4 lg:p-14">
    <section class="coolumns-1 space-y-6 overflow-visible md:columns-3">
      {#each testimonialSection.settings.list as item}
        <div class="break-inside-avoid overflow-visible">
          <section
            class="relative flex h-fit w-full max-w-full cursor-pointer flex-col gap-4 overflow-visible rounded-3xl border border-[#D7D7D7] bg-white p-4 px-6 pt-6 sm:max-w-[320px] xl:max-w-[400px]"
          >
            <div class="flex items-center gap-2">
              <img
                src={item.banner ?? '/classroomio-course-img-template.jpg'}
                alt=""
                class="h-10 w-10 rounded-full"
              />
              <span class="flex flex-col items-start">
                <p class="text-sm font-bold">{item.name}</p>
                <p class="text-sm text-[#4C5A70]">{item.role}</p>
              </span>
            </div>
            <div>
              <p class=" text-[#282828] dark:text-[#ABABAB]">
                {item.description}
              </p>
            </div>
          </section>
        </div>
      {/each}
    </section>
  </section>
{/if}

<!-- footernote -->
{#if footerNoteSection?.show}
  <section class="w-full bg-[#F4F4F4] px-4 py-16 lg:px-10">
    <div
      class="min-h-40 relative mx-auto flex w-full flex-col justify-center divide-x divide-transparent rounded-xl border-2 border-[#141414] md:flex-row lg:w-[80%]"
    >
      <div
        class="min-h-40 flex w-full items-center justify-center rounded-t-xl bg-[#E5E7E0] px-4 py-20 text-center text-4xl font-bold capitalize md:w-[65%] md:rounded-l-xl md:text-start lg:px-10"
      >
        <h1 class="leading-normal">
          {footerNoteSection.settings.title}<br />{footerNoteSection.settings.titleHighlight}
        </h1>
      </div>

      <div
        class="min-h-40 flex w-full items-center justify-center rounded-b-xl bg-white px-4 py-16 text-lg font-semibold md:w-[35%] md:rounded-r-xl"
      >
        <p>
          {footerNoteSection.settings.subtitle}
        </p>
        <Button
          class="absolute -bottom-5 rounded-2xl border-[1.5px] border-[#141414] bg-white py-6 uppercase text-[#141414] shadow-[0px_3px_#141414] hover:bg-white hover:text-black"
        >
          {footerNoteSection.settings.buttonLabel}
        </Button>
      </div>
    </div>
  </section>
{/if}

<style>
  /* Hide scrollbar for Webkit browsers */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for other browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .break-inside-avoid {
    break-inside: avoid;
  }
</style>
