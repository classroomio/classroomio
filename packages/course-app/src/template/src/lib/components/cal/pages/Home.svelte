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

  /**
   * State
   */
  // let coursesList = [1, 2, 3, 4, 5, 6, 7];
  let scrollContainer: HTMLElement | undefined = $state();

  /**
   * Constants
   */
  const coursesSection = $derived(getPageSection($homePage, 'courses'));
  const aboutSection = $derived(getPageSection($homePage, 'about'));
  const faqSection = $derived(getPageSection($homePage, 'faq'));
  const testimonialSection = $derived(getPageSection($homePage, 'testimonial'));
  const footerNoteSection = $derived(getPageSection($homePage, 'cta'));

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
  {@const content = getPageSection($homePage, 'header')}
  {#if content?.show}
    <section
      class="font-matter flex items-start md:items-center justify-center py-10 lg:py-20 px-5 lg:px-20 h-full bg-[#F4F4F4]"
    >
      <section
        class="flex flex-col-reverse lg:flex-row items-center justify-center lg:justify-between"
      >
        <div class="text-center lg:text-start space-y-6 w-full mt-4 lg:mt-0">
          <div
            class="bg-[#E5E7E0] py-1 px-4 md:border-b border-black rounded-sm w-fit mx-auto lg:mx-0"
          >
            <p class="uppercase font-bold text-xs lg:text-base text-[#0F163F]">
              {content.settings.title}
            </p>
          </div>
          <p
            class="text-4xl md:text-6xl font-black w-full mx-auto lg:mx-0 md:w-[90%] lg:w-[80%] capitalize"
          >
            {content.settings.titleHighlight}
          </p>
          <p class="font-semibold text-xl w-full md:w-[80%] mx-auto lg:mx-0 lg:w-[70%]">
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
          class="relative w-[250px] h-[250px] lg:w-[500px] lg:h-[350px] flex items-center justify-center"
        >
          <svg
            class="absolute -left-[15px] lg:-left-[60px] xl:-left-[100px] w-[270px] h-[270px] lg:w-[400px] xl:w-[520px] lg:h-[370px]"
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
            src={content.settings.banner?.image
              ? content.settings.banner?.image
              : '/calcom-banner-img.jpeg'}
            class="object-cover rounded-full w-[250px] h-[250px] lg:w-[500px] lg:h-[350px]"
          />
        </div>
      </section>
    </section>
  {/if}
{/if}

<!-- courses -->
{#if coursesSection?.show}
  <section id="course" class="flex items-center px-2 md:px-8 py-12 h-full bg-[#E5E7E0]">
    <div class="text-white py-8 bg-black rounded-3xl w-full lg:w-[90%] mx-auto">
      <div
        class="flex flex-col md:flex-row items-center justify-center md:items-start gap-2 md:justify-between px-4 lg:px-8"
      >
        <h1
          class="text-white text-start text-2xl md:text-3xl lg:text-5xl mb-2 font-bold w-full md:w-[80%] lg:w-[60%]"
        >
          {coursesSection.settings.title}
        </h1>

        <div class="hidden md:flex gap-2 items-center">
          <button
            class="w-fit flex items-center justify-center border border-white rounded-full p-2 bg-transparent hover:bg-white hover:text-black"
            onclick={scrollLeft}
          >
            <ArrowLeft />
          </button>
          <button
            class="w-fit flex items-center justify-center border border-white rounded-full p-2 bg-transparent hover:bg-white hover:text-black"
            onclick={scrollRight}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      <div class="w-full pl-4 md:pl-8 overflow-x-hidden">
        {#if $courses.length > 0}
          <section
            bind:this={scrollContainer}
            class="flex items-center overflow-x-auto gap-4 py-4 pr-2 w-full scrollbar-hide"
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
          <div class="w-full mx-auto">
            <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
          </div>
        {/if}
      </div>

      <div class="flex items-center justify-center w-full pt-4">
        <Button
          class="uppercase rounded-2xl py-6 px-10 bg-transparent border-[1.5px] border-white text-white shadow-[-1px_3px_#FFFFFF]"
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
    <div class="relative px-4 md:px-10 py-10 h-full w-full mx-auto xl:w-[80%]">
      <h1 class="text-center text-5xl mb-2 font-bold md:w-[60%] mx-auto">
        {aboutSection.settings.title}
      </h1>
      <p class="text-center dark:text-white text-lg font-semibold md:w-[70%] mb-8 mx-auto">
        {aboutSection.settings.subtitle}
      </p>
      <div>
        <section class="flex flex-wrap items-start justify-center w-full gap-6 py-4">
          {#each aboutSection.settings.benefits.list as item}
            <div
              class="flex flex-col gap-2 p-4 bg-white border border-[#282828] h-[130px] max-h-[180px] w-full max-w-full md:max-w-[320px] lg:max-w-[450px] rounded-lg overflow-hidden"
            >
              <span class="flex items-center gap-2">
                <CheckmarkFilled size={24} />
                <p class="text-lg capitalize line-clamp-1">{item.title}</p>
              </span>
              <p class="text-sm text-[#878787] line-clamp-3">{item.subtitle}</p>
            </div>
          {/each}
        </section>
      </div>
    </div>
  </section>
{/if}

<!-- faq -->
{#if faqSection?.show}
  <section id="faq" class="relative px-2 pt-4 pb-20 h-full">
    <div class="absolute inset-0 bg-[#E5E7E0] opacity-60"></div>

    <div class="relative">
      <h1 class="text-center text-5xl font-bold mb-4">
        {faqSection.settings.title}
      </h1>
      <h1 class="text-center text-lg font-semibold mb-4 w-full md:w-[80%] lg:w-[60%] mx-auto">
        {faqSection.settings.subtitle}
      </h1>
      <section class="py-4 px-2 space-y-10 w-full md:w-[80%] mx-auto">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </div>
  </section>
{/if}

<!-- testimonial -->
{#if testimonialSection?.show}
  <section id="testimonial" class="bg-[#F4F4F4] px-4 lg:p-14 h-fit">
    <section class="coolumns-1 md:columns-3 space-y-6 overflow-visible">
      {#each testimonialSection.settings.list as item}
        <div class="break-inside-avoid overflow-visible">
          <section
            class="cursor-pointer flex flex-col relative overflow-visible px-6 pt-6 gap-4 p-4 bg-white border border-[#D7D7D7] rounded-3xl w-full h-fit max-w-full sm:max-w-[320px] xl:max-w-[400px]"
          >
            <div class="flex items-center gap-2">
              <img
                src={item.banner ?? '/classroomio-course-img-template.jpg'}
                alt=""
                class="w-10 h-10 rounded-full"
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
  <section class="w-full bg-[#F4F4F4] py-16 px-4 lg:px-10">
    <div
      class="relative flex flex-col md:flex-row min-h-40 justify-center border-2 border-[#141414] rounded-xl divide-x divide-transparent w-full lg:w-[80%] mx-auto"
    >
      <div
        class="bg-[#E5E7E0] text-center md:text-start rounded-t-xl md:rounded-l-xl flex justify-center capitalize items-center py-20 px-4 lg:px-10 w-full md:w-[65%] min-h-40 text-4xl font-bold"
      >
        <h1 class="leading-normal">
          {footerNoteSection.settings.title}<br />{footerNoteSection.settings.titleHighlight}
        </h1>
      </div>

      <div
        class="rounded-b-xl md:rounded-r-xl flex items-center justify-center py-16 px-4 bg-white w-full md:w-[35%] min-h-40 text-lg font-semibold"
      >
        <p>
          {footerNoteSection.settings.subtitle}
        </p>
        <Button
          class="absolute -bottom-5 uppercase rounded-2xl py-6 bg-white hover:bg-white hover:text-black border-[1.5px] border-[#141414] text-[#141414] shadow-[0px_3px_#141414]"
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
