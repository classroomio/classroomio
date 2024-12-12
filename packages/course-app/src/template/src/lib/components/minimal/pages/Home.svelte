<script lang="ts">
  import { homePage } from '@/utils/stores/pages';
  import { getPageSection } from '@/utils/helpers/page';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { goto } from '$app/navigation';
  import defaultBanner from '../assets/classroomio-course-img-template.jpg';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';
  import Accordion from '../Accordion.svelte';

  const courseSection = $derived(getPageSection($homePage, 'about'));
  const learnSection = $derived(getPageSection($homePage, 'about'));
  const testimonialSection = $derived(getPageSection($homePage, 'testimonial'));
  const faqSection = $derived(getPageSection($homePage, 'faq'));
  const footerNoteSection = $derived(getPageSection($homePage, 'cta'));

  let viewAll = $state(false);
</script>

<main class="bg-[#101720]">
  <!-- hero -->
  {#if $homePage}
    {@const content = getPageSection($homePage, 'header')}
    {#if content?.show}
      <section class="flex items-center justify-center py-2 px-10 md:py-14 md:px-14 max-h-full">
        <section class="flex items-center justify-between gap-4">
          <div class="text-white space-y-6 w-full">
            <div class="bg-[#DCFCFFED] py-1 px-3 md:border rounded-sm w-[90%]">
              <p class="text-center uppercase font-bold text-sm text-[#0F163F]">
                {content.settings?.title}
              </p>
            </div>
            <p class="text-4xl font-bold w-full md:w-[70%] capitalize">
              {content.settings?.titleHighlight}
            </p>
            <p class="w-full md:w-[70%]">
              {content.settings?.subtitle}
            </p>
            <PrimaryButton
              onClick={() => {
                goto(content.settings?.action.link);
              }}
              label={content.settings?.action.label}
            />
          </div>
          <div class="hidden rounded-md h-[280px] max-h-[400px] w-5/6 md:w-full lg:block">
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings?.banner?.image
                ? content.settings?.banner?.image
                : defaultBanner}
              class="mt-2 h-full max-h-[400px] w-full max-w-[500px] rounded-md md:mt-0 object-cover"
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
      class="flex items-start justify-center px-10 lg:px-14 h-full bg-white py-20 mx-auto"
    >
      <section class="flex flex-col lg:flex-row gap-8 items-start justify-center">
        <div class="w-full lg:w-[60%] space-y-4">
          <p class="text-4xl font-bold">{learnSection.settings.title}</p>
          <p class="w-full lg:w-[80%] text-base leading-7 text-[#878787]">
            {learnSection.settings.content}
          </p>
        </div>
        {#if learnSection.settings.benefits}
          <div class="w-full lg:w-fit space-y-8">
            <span
              class="bg-[#DCFCFF] py-1 px-3 uppercase border border-[#0233BD] rounded-sm text-center font-bold text-base text-[#0233BD]"
              >{learnSection.settings.benefits.title}</span
            >
            <ul class="space-y-6 text-base text-[#696969] font-medium">
              {#each learnSection.settings.benefits.list as items}
                <li class="border-l border-[#0233BD] pl-3">{items.title}</li>
              {/each}
            </ul>
          </div>
        {:else}
          <img
            src={learnSection.settings.imageUrl}
            alt="Our Story"
            class="rounded-2xl max-h-[450px]"
          />
        {/if}
      </section>
    </section>
  {/if}

  <!-- courses -->

  {#if courseSection?.show}
    <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
      <h1 class="text-center text-3xl font-bold mb-4">{courseSection.settings.title}</h1>
      <div class="w-full md:w-[90%] mx-auto">
        {#if $courses.length > 0}
          <section
            class="grid place-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
          >
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
            <div class="w-full flex items-center justify-center my-5">
              <PrimaryButton
                class="p-2"
                onClick={() => (viewAll = !viewAll)}
                label="VIEW MORE COURSES"
              />
            </div>
          {/if}
        {:else}
          <div class="px-4 w-full lg:w-[70%] mx-auto">
            <EmptyState />
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- testimonial -->
  {#if testimonialSection?.show}
    <section id="testimonial" class="px-4 pt-4 pb-20 h-full bg-white">
      <h1 class="text-center text-3xl font-bold mb-4">Student testimonial</h1>
      <div class="w-full md:w-[90%] mx-auto">
        <section class="grid place-items-center grid-cols-1 md:grid-cols-3 gap-4">
          {#each testimonialSection.settings.list as item}
            <TestimonialCard name={item.name} description={item.description} role={item.role} />
          {/each}
        </section>
      </div>
    </section>
  {/if}

  <!-- faq -->
  {#if faqSection?.show}
    <section class="px-4 pt-4 pb-20 h-full bg-[#F9F9F9]">
      <h1 class="text-center text-3xl font-bold mb-4">{faqSection.settings.title}</h1>
      <section class="p-4 space-y-10 w-full md:w-[80%] mx-auto">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </section>
  {/if}

  <!-- footerNote -->
  {#if footerNoteSection?.show}
    <section
      class="flex flex-col md:flex-row items-center justify-between px-6 lg:px-10 py-20 bg-blue-800"
    >
      <div class="flex items-center justify-center w-full">
        <p
          class="text-4xl text-white text-center md:text-start font-bold w-full lg:w-[70%] capitalize"
        >
          {footerNoteSection.settings.title}
        </p>
      </div>
      <div class="w-full flex items-center justify-center my-5">
        <PrimaryButton
          onClick={() => goto('/courses')}
          class="py-2 bg-white text-blue-700 hover:bg-white"
          label={footerNoteSection.settings.buttonLabel}
        />
      </div>
    </section>
  {/if}
</main>
