<script lang="ts">
  import { homePage } from '@/utils/stores/pages';
  import { getPageSection } from '@/utils/helpers/page';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { goto } from '$app/navigation';
  import defaultBanner from '../assets/course-banner.jpg';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';
  import Accordion from '../Accordion.svelte';
  import testimonial from '../assets/testimonial.svg';
  import { SECTION } from '@/utils/constants/page';

  const courseSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const learnSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const footerNoteSection = $derived(getPageSection($homePage, SECTION.FOOTERNOTE));

  let viewAll = $state(false);
</script>

<!-- for some reason the custom color doesnt work for this template -->
<main class="bg-[#101720]">
  <!-- hero -->
  {#if $homePage}
    {@const content = getPageSection($homePage, SECTION.HERO)}
    {#if content?.show}
      <section class="flex max-h-full items-center justify-center px-5 py-5 md:px-14 md:py-14">
        <section class="flex items-center justify-between gap-4">
          <div class="w-full space-y-6 text-white">
            <div class="w-[90%] rounded-sm bg-[#DCFCFFED] px-3 py-1 md:border">
              <p class="text-center text-sm font-bold uppercase text-[#0F163F]">
                {content.settings?.title}
              </p>
            </div>
            <p class="w-full text-4xl font-bold capitalize md:w-[70%]">
              {content.settings?.titleHighlight}
            </p>
            <p class="w-full md:w-[70%]">
              {content.settings?.subtitle}
            </p>
            <PrimaryButton
              class="bg-[#0542CC]"
              onClick={() => {
                goto(content.settings?.action.link);
              }}
              label={content.settings?.action.label}
            />
          </div>
          <div class="hidden h-[280px] max-h-[400px] w-5/6 rounded-md md:w-full lg:block">
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings?.banner?.image
                ? content.settings?.banner?.image
                : defaultBanner}
              class="mt-2 h-full max-h-[400px] w-full max-w-[500px] rounded-md object-cover md:mt-0"
            />
          </div>
        </section>
      </section>
    {/if}
  {/if}

  <!-- learn -->

  {#if learnSection?.show}
    <section
      id="about"
      class="mx-auto flex h-full items-start justify-center bg-white px-5 py-20 md:px-14"
    >
      <section class="flex flex-col items-start justify-center gap-8 lg:flex-row">
        <div class="w-full space-y-4 lg:w-[60%]">
          <p class="text-4xl font-bold">{learnSection.settings.title}</p>
          <p class="w-full text-base leading-7 text-[#878787] lg:w-[80%]">
            {learnSection.settings.subtitle}
          </p>
        </div>
        {#if learnSection.settings.benefits}
          <div class="w-full space-y-8 lg:w-fit">
            <span
              class="rounded-sm border border-[#0233BD] bg-[#DCFCFF] px-3 py-1 text-center text-base font-bold uppercase text-[#0233BD]"
              >{learnSection.settings.benefits.title}</span
            >
            <ul class="space-y-6 text-base font-medium text-[#696969]">
              {#each learnSection.settings.benefits.list as items}
                <li class="border-l border-[#0233BD] pl-3">{items.title}</li>
              {/each}
            </ul>
          </div>
        {:else}
          <img
            src={learnSection.settings.imageUrl}
            alt="Our Story"
            class="max-h-[450px] rounded-2xl"
          />
        {/if}
      </section>
    </section>
  {/if}

  <!-- courses -->

  {#if courseSection?.show}
    <section id="course" class="h-full space-y-10 bg-white px-5 py-36 pt-10">
      <h1 class="mx-auto mb-4 w-full text-center text-3xl font-bold md:w-[70%]">
        {courseSection.settings.title}
      </h1>
      <div class="mx-auto w-full md:w-[90%]">
        {#if $courses.length > 0}
          <section class="mx-auto flex w-fit flex-wrap items-center gap-4 p-4">
            {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
              <CourseCard
                className="bg-[#FDFDFD]"
                slug={courseData.slug}
                title={courseData.title}
                description={courseData.description}
                cost={courseData.cost}
                lessons={courseData.lessonsCount}
                currency={courseData.currency}
              />
            {/each}
          </section>
          {#if $courses.length > 3}
            <div class="my-5 flex w-full items-center justify-center">
              <PrimaryButton
                class="p-2"
                onClick={() => (viewAll = !viewAll)}
                label="VIEW MORE COURSES"
              />
            </div>
          {/if}
        {:else}
          <div class="mx-auto w-full px-4 lg:w-[70%]">
            <EmptyState />
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- testimonial -->
  {#if testimonialSection?.show}
    <section id="testimonial" class="relative h-full pt-10 text-white">
      <div class="absolute -top-20 left-[5%] w-[90%] md:-top-32">
        <img src={testimonial} alt="testimonial" class="max-h-[500px] w-full md:max-h-[300px]" />
      </div>
      <div class="space-y-10 px-5 py-20 md:py-40">
        <h1 class="mb-4 text-center text-3xl font-bold">Student testimonial</h1>
        <div class="mx-auto w-full md:w-[90%]">
          <section class="mx-auto grid w-fit grid-cols-1 place-items-center gap-4 md:grid-cols-3">
            {#each testimonialSection.settings.list as item}
              <TestimonialCard name={item.name} description={item.description} role={item.role} />
            {/each}
          </section>
        </div>
      </div>
    </section>
  {/if}

  <!-- faq -->
  {#if faqSection?.show}
    <section class="h-full space-y-10 bg-[#F9F9F9] px-5 py-20">
      <h1 class="mb-4 text-center text-3xl font-bold">{faqSection.settings.title}</h1>
      <section class="mx-auto w-full space-y-10 p-4 md:w-[80%]">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </section>
  {/if}

  <!-- footerNote -->
  {#if footerNoteSection?.show}
    <section
      class="flex flex-col items-center justify-between bg-blue-800 px-6 py-20 md:flex-row lg:px-10"
    >
      <div class="flex w-full items-center justify-center">
        <p
          class="w-full text-center text-4xl font-bold capitalize text-white md:text-start lg:w-[70%]"
        >
          {footerNoteSection.settings.title}
        </p>
      </div>
      <div class="my-5 flex w-full items-center justify-center">
        <PrimaryButton
          onClick={() => goto('/courses')}
          class="bg-white py-2 text-blue-700 hover:bg-white"
          label={footerNoteSection.settings.buttonLabel}
        />
      </div>
    </section>
  {/if}
</main>
