<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from '../PrimaryButton.svelte';
  import analytics from '../assets/analytics.png';
  import { Button } from '@/components/ui/button';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { CheckmarkFilled } from 'carbon-icons-svelte';
  import FaqCard from '../FaqCard.svelte';
  import { SECTION } from '@/utils/constants/page';

  const coursesSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const footerNoteSection = $derived(getPageSection($homePage, SECTION.FOOTERNOTE));

  function getCourseUrl() {
    return '/courses';
  }

  let viewAll = $state(false);
</script>

<div class="bg-posthog-background">
  <!-- hero -->
  {#if $homePage}
    {@const content = getPageSection($homePage, SECTION.HERO)}
    {#if content?.show}
      <section
        class="font-matter flex min-h-full items-center justify-center overflow-hidden px-10 py-14 md:px-14"
      >
        <section
          class="flex flex-col-reverse items-center justify-center gap-5 text-center md:flex-col"
        >
          <div class="mb-4 w-full space-y-6">
            <p class="mx-auto w-full text-3xl font-bold md:w-[80%] md:text-5xl lg:w-[70%]">
              {content.settings.title}
            </p>

            <p class="mx-auto w-full text-lg md:w-[80%] lg:w-[70%]">
              {content.settings.subtitle}
            </p>
            <PrimaryButton
              onClick={() => {
                goto(content.settings.action.link);
              }}
              label={content.settings.action.label}
            />
          </div>

          <div class=" relative flex w-full rounded-lg md:w-[800px] md:max-w-[80vw] lg:max-w-[80%]">
            <span class="absolute -top-14 left-3 h-2 w-2 rounded-full bg-red-500"></span>
            <span class="absolute -left-10 top-10 h-2 w-2 rounded-full bg-white"></span>
            <span class="absolute -right-3 -top-10 h-2 w-2 rounded-full bg-yellow-500"></span>
            <span class="absolute -right-10 top-14 h-2 w-2 rounded-full bg-blue-800"></span>

            <div class="flex h-full w-full items-center justify-center">
              <img alt="Hero Banner" src={analytics} class="w-full rounded-lg object-cover" />
            </div>
          </div>
        </section>
      </section>
    {/if}
  {/if}

  <!-- courses -->
  {#if coursesSection?.show}
    <section id="course" class="h-full px-4 pb-20 pt-4 md:px-10">
      <h1 class="mx-auto mb-8 w-full text-center text-3xl font-bold md:w-[90%] lg:w-[70%]">
        {coursesSection.settings.title}
        <span class="text-[#F54E00] dark:text-[#EB9D2A]"
          >{coursesSection.settings.titleHighlight}</span
        >
      </h1>
      {#if $courses.length > 0}
        <section class="mx-auto flex flex-wrap items-center justify-center gap-4">
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              slug={courseData.slug}
              title={courseData.title}
              description={courseData.description}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="my-5 flex w-full items-center justify-center">
            <Button
              on:click={() => (viewAll = !viewAll)}
              class="mb-4 bg-white font-bold capitalize text-black shadow-[0px_3px_#B17816] ring-1 ring-[#B17816] hover:scale-95 hover:bg-[#EB9D2A] dark:bg-[#EB9D2A] dark:text-black"
            >
              {viewAll === true ? 'Show less' : 'View more courses'}
            </Button>
          </div>
        {/if}
      {:else}
        <div class="mx-auto w-full lg:w-[70%]">
          <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
        </div>
      {/if}
    </section>
  {/if}

  <!-- about -->
  {#if aboutSection?.show}
    <section
      id="about"
      class="mx-auto h-full w-full px-4 pb-20 pt-4 md:w-[90%] md:px-10 lg:w-[80%]"
    >
      <h1 class="mb-2 text-start text-3xl font-bold md:w-[50%]">{aboutSection.settings.title}</h1>
      <p class="mb-8 text-start text-sm font-semibold text-[#3D3D3D] dark:text-white md:w-[70%]">
        {aboutSection.settings.subtitle}
      </p>
      <div>
        <p class="mb-6 text-xl font-bold capitalize">{aboutSection.settings.benefits.title}</p>
        <section class="grid grid-cols-1 place-items-center gap-4 md:grid-cols-2">
          {#each aboutSection.settings.benefits.list as item}
            <div
              class="flex h-[150px] max-h-[200px] w-full max-w-full flex-col gap-2 overflow-hidden rounded-lg border border-[#D0D1C9] bg-[#E5E7E0] p-4 dark:bg-[#232429] md:max-w-[320px] lg:max-w-[450px]"
            >
              <span class="flex items-center gap-2">
                <CheckmarkFilled size={24} class=" fill-[#F54E00] dark:fill-[#EB9D2A]" />
                <p class="line-clamp-1 text-lg font-bold capitalize">{item.title}</p>
              </span>
              <p class="line-clamp-4 text-sm">{item.subtitle}</p>
            </div>
          {/each}
        </section>
      </div>
    </section>
  {/if}

  <!-- faq -->
  {#if faqSection?.show}
    <div id="faq">
      <h1 class="mb-8 text-center text-3xl font-bold">{faqSection.settings.title}</h1>
      <div class="mx-auto flex flex-wrap items-center justify-center gap-8 p-4">
        {#each faqSection.settings.questions as faq, index}
          <FaqCard {index} {faq} />
        {/each}
      </div>
    </div>
  {/if}

  <!-- footerNote -->
  {#if footerNoteSection?.show}
    <section class="h-full w-full p-4 md:p-20">
      <section
        class="mx-auto flex w-fit flex-col items-center justify-between space-y-4 rounded-md bg-[#E5E7E0] px-2 py-20 dark:bg-[#232429] md:w-[80%] lg:px-5"
      >
        <div class="flex w-full items-center justify-center">
          <p
            class="mx-auto w-full text-center text-4xl font-bold capitalize lg:w-[90%] xl:text-start"
          >
            {footerNoteSection.settings.title}

            <span class="text-[#F54E00]">{footerNoteSection.settings.titleHighlight}</span>
          </p>
        </div>
        <div
          class="flex w-full flex-col items-center gap-4 lg:w-[90%] lg:flex-row lg:items-end lg:justify-between lg:gap-0"
        >
          <p class="w-full text-center text-sm font-semibold lg:w-[50%] lg:text-start">
            {footerNoteSection.settings.subtitle}
          </p>

          <div class="w-fit">
            <PrimaryButton
              href={getCourseUrl()}
              class="bg-white px-8 text-black transition hover:bg-white"
              label={footerNoteSection.settings.buttonLabel}
            />
          </div>
        </div>
      </section>
    </section>
  {/if}
</div>
