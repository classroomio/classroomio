<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from '../PrimaryButton.svelte';
  import analytics from '../static/analytics.png';
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
        class="font-matter flex items-center justify-center py-14 px-10 md:px-14 min-h-full overflow-hidden"
      >
        <section
          class="flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
        >
          <div class="space-y-6 w-full mb-4">
            <p class="text-3xl md:text-5xl font-bold w-full md:w-[80%] lg:w-[70%] mx-auto">
              {content.settings.title}
            </p>

            <p class="w-full text-lg md:w-[80%] lg:w-[70%] mx-auto">
              {content.settings.subtitle}
            </p>
            <PrimaryButton
              onClick={() => {
                goto(content.settings.action.link);
              }}
              label={content.settings.action.label}
            />
          </div>

          <div class=" relative rounded-lg w-full md:w-[800px] md:max-w-[80vw] lg:max-w-[80%] flex">
            <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3"></span>
            <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10"></span>
            <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3"></span>
            <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10"></span>

            <div class="w-full h-full flex items-center justify-center">
              <img alt="Hero Banner" src={analytics} class="w-full rounded-lg object-cover" />
            </div>
          </div>
        </section>
      </section>
    {/if}
  {/if}

  <!-- courses -->
  {#if coursesSection?.show}
    <section id="course" class="px-4 pt-4 pb-20 h-full md:px-10">
      <h1 class="text-center text-3xl mb-8 font-bold w-full md:w-[90%] lg:w-[70%] mx-auto">
        {coursesSection.settings.title}
        <span class="text-[#F54E00] dark:text-[#EB9D2A]"
          >{coursesSection.settings.titleHighlight}</span
        >
      </h1>
      {#if $courses.length > 0}
        <section class="flex flex-wrap items-center justify-center mx-auto gap-4">
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              slug={courseData.slug}
              title={courseData.title}
              description={courseData.description}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <Button
              on:click={() => (viewAll = !viewAll)}
              class="dark:text-black bg-white text-black capitalize ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
            >
              {viewAll === true ? 'Show less' : 'View more courses'}
            </Button>
          </div>
        {/if}
      {:else}
        <div class="w-full lg:w-[70%] mx-auto">
          <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
        </div>
      {/if}
    </section>
  {/if}

  <!-- about -->
  {#if aboutSection?.show}
    <section
      id="about"
      class="px-4 md:px-10 pt-4 pb-20 h-full w-full mx-auto md:w-[90%] lg:w-[80%]"
    >
      <h1 class="text-start text-3xl mb-2 font-bold md:w-[50%]">{aboutSection.settings.title}</h1>
      <p class="text-start text-[#3D3D3D] dark:text-white text-sm font-semibold md:w-[70%] mb-8">
        {aboutSection.settings.subtitle}
      </p>
      <div>
        <p class="text-xl font-bold capitalize mb-6">{aboutSection.settings.benefits.title}</p>
        <section class="grid place-items-center grid-cols-1 md:grid-cols-2 gap-4">
          {#each aboutSection.settings.benefits.list as item}
            <div
              class="flex flex-col gap-2 p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] h-[150px] max-h-[200px] w-full max-w-full md:max-w-[320px] lg:max-w-[450px] rounded-lg overflow-hidden"
            >
              <span class="flex items-center gap-2">
                <CheckmarkFilled size={24} class=" fill-[#F54E00] dark:fill-[#EB9D2A]" />
                <p class="text-lg font-bold capitalize line-clamp-1">{item.title}</p>
              </span>
              <p class="text-sm line-clamp-4">{item.subtitle}</p>
            </div>
          {/each}
        </section>
      </div>
    </section>
  {/if}

  <!-- faq -->
  {#if faqSection?.show}
    <div id="faq">
      <h1 class="text-center text-3xl mb-8 font-bold">{faqSection.settings.title}</h1>
      <div class="flex flex-wrap items-center justify-center mx-auto gap-8 p-4">
        {#each faqSection.settings.questions as faq, index}
          <FaqCard {index} {faq} />
        {/each}
      </div>
    </div>
  {/if}

  <!-- footerNote -->
  {#if footerNoteSection?.show}
    <section class="w-full h-full p-4 md:p-20">
      <section
        class="mx-auto w-fit md:w-[80%] flex flex-col items-center justify-between px-2 lg:px-5 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md"
      >
        <div class="flex items-center justify-center w-full">
          <p
            class="text-4xl text-center xl:text-start font-bold w-full mx-auto lg:w-[90%] capitalize"
          >
            {footerNoteSection.settings.title}

            <span class="text-[#F54E00]">{footerNoteSection.settings.titleHighlight}</span>
          </p>
        </div>
        <div
          class="w-full lg:w-[90%] flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-0 lg:justify-between"
        >
          <p class="text-center lg:text-start text-sm font-semibold w-full lg:w-[50%]">
            {footerNoteSection.settings.subtitle}
          </p>

          <div class="w-fit">
            <PrimaryButton
              href={getCourseUrl()}
              class="px-8 transition bg-white hover:bg-white text-black"
              label={footerNoteSection.settings.buttonLabel}
            />
          </div>
        </div>
      </section>
    </section>
  {/if}
</div>
