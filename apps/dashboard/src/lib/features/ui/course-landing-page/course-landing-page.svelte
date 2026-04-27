<script lang="ts">
  import get from 'lodash/get';
  import pluralize from 'pluralize';
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import PlayIcon from '@lucide/svelte/icons/play';
  import UserIcon from '@lucide/svelte/icons/user';
  import StarIcon from '@lucide/svelte/icons/star';
  import UsersIcon from '@lucide/svelte/icons/users';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';

  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { BlurIn } from '@cio/ui/custom/animation/blurin';
  import { DotPattern } from '@cio/ui/custom/animation/dot-pattern';
  import { HeroVideoDialog } from '@cio/ui/custom/animation/hero-video-dialog';
  import { Sparkle } from '@cio/ui/custom/animation/sparkle';
  import { MagicCard } from '@cio/ui/custom/animation/magic-card';

  import { getLectureNo } from '$features/course/utils/functions';
  import { currentOrg } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import Navigation from '$lib/components/Navigation/index.svelte';
  import { NAV_ITEM_KEY, NAV_ITEMS } from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { handleOpenWidget, reviewsModalStore } from './store';
  import type { Course, CourseMetadata } from '$features/course/utils/types';
  import { courseApi } from '$features/course/api';
  import { formatYoutubeEmbedUrl, isYoutubeUrl } from '@cio/ui/custom/media-player';
  import { filterNavItems, getCourseLessons, getCourseSections, getTotalLessons } from './utils';
  import { Button } from '@cio/ui/base/button';

  import { Chip } from '@cio/ui/custom/chip';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import * as Dialog from '@cio/ui/base/dialog';
  import Image from '$features/ui/image.svelte';
  import PoweredBy from '$features/ui/upgrade-powered-by.svelte';
  import UploadWidget from '$features/ui/upload-widget/upload-widget.svelte';
  import HTMLRender from '$features/ui/html-render.svelte';
  import * as Avatar from '@cio/ui/base/avatar';
  import PricingSection from './components/pricing-section.svelte';
  import NavSection from './components/nav-section.svelte';
  import SectionsDisplay from './components/sections-display.svelte';
  import { observeIntersection } from './components/intersection-observer';

  interface Props {
    editMode?: boolean;
    courseData: Course;
    showStandaloneShell?: boolean;
  }

  let { editMode = false, courseData = $bindable(), showStandaloneShell = true }: Props = $props();

  const reviews = $derived(get(courseData, 'metadata.reviews') || []);
  const video = $derived(get(courseData, 'metadata.videoUrl'));

  const lessons = $derived(getCourseLessons(courseData));
  const totalRatings = $derived(reviews?.reduce((acc = 0, review) => acc + (review?.rating || 0), 0));
  const averageRating = $derived(reviews?.length ? (totalRatings / reviews.length).toFixed(1) : null);
  const expandDescription = $derived(Array(reviews?.length ?? 0).fill(false));

  const allowNewStudent = $derived(get(courseData, 'metadata.allowNewStudent'));
  const bannerImage = $derived(get(courseData, 'logo'));
  const instructor = $derived(get(courseData, 'metadata.instructor') || {});
  const organizationName = $derived(get(courseData, 'org.name') || $currentOrg.name || '');
  const instructorName = $derived.by(() => {
    const name = get(instructor, 'name');
    return typeof name === 'string' && name.trim() ? name : organizationName;
  });
  const instructorImageUrl = $derived.by(() => {
    const imageUrl = get(instructor, 'imgUrl');
    return typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl : '/images/avatar.svg';
  });
  const certificate = $derived(
    get(courseData, 'metadata.certificate', {
      templateUrl: '/images/certificate-template.svg'
    }) as CourseMetadata['certificate']
  );

  const navItems = $derived(filterNavItems(courseData, reviews));
  const navItemKeys = $derived(navItems.map((item) => item.key));

  let startCoursePayment = $state(false);
  let isVisible = $state(false);
  let observer: { destroy: () => void };

  let activeNav = $state(NAV_ITEMS[0].key);

  const courseSections = $derived(getCourseSections(courseData));
  const totalLessons = $derived(getTotalLessons(courseSections));
  const studentCount = $derived(courseData.group?.members?.length ?? 0);

  const videoEmbedUrl = $derived(video ? (isYoutubeUrl(video) ? formatYoutubeEmbedUrl(video) : video) : '');

  function locationHashChanged() {
    activeNav = window.location.hash;
  }

  function toggleDescription(id: number) {
    expandDescription[id] = !expandDescription[id];
  }

  onMount(() => {
    window.onhashchange = locationHashChanged;

    const targetNode = document.querySelector('.target-component');
    observer = observeIntersection(targetNode, (inView: boolean) => {
      isVisible = inView;
    });
  });

  onDestroy(() => {
    observer?.destroy();
  });
</script>

{#if !editMode && showStandaloneShell}
  <PoweredBy />
{/if}

{#if !editMode && showStandaloneShell}
  <Navigation
    logo={$currentOrg.avatarUrl || '/logo-192.png'}
    orgName={$currentOrg.name}
    disableSignup={$currentOrg.disableSignup || ($currentOrg.settings?.signup?.inviteOnly ?? false)}
    isOrgSite={$globalStore.isOrgSite}
    customLinks={$currentOrg.landingpage?.customLinks}
  />
{/if}

<div class="flex w-full flex-col items-center bg-white dark:bg-black">
  {#if showStandaloneShell}
    <!-- Hero Section -->
    <header class="relative w-full overflow-hidden bg-[#040f2d] py-12 md:py-20">
      <DotPattern
        class="[mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] opacity-10"
        fillColor="rgb(255 255 255 / 0.5)"
      />

      <div
        class="relative z-10 mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-8 px-6 md:flex-row md:gap-12"
      >
        <!-- Course Description -->
        <div class="w-full py-4 md:w-1/2">
          <BlurIn class="my-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            {get(courseData, 'title', '')}
          </BlurIn>

          <BlurFade delay={0.2}>
            <p class="mb-6 text-base leading-relaxed text-gray-300 md:text-lg">
              {get(courseData, 'description', '')}
            </p>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p class="mb-6 text-sm text-blue-300">
              {instructorName}
            </p>
          </BlurFade>

          <BlurFade delay={0.4}>
            <Button
              class="hidden h-12 px-8 text-base font-semibold sm:w-fit md:block"
              onclick={() => {
                if (editMode) return;
                startCoursePayment = true;
              }}
              disabled={!allowNewStudent}
            >
              {$t('course.navItem.landing_page.start_course')}
            </Button>
          </BlurFade>

          {#if $handleOpenWidget.open}
            <UploadWidget
              imageURL={courseApi.course?.logo}
              onchange={(newLogo) => (courseApi.course!.logo = newLogo)}
            />
          {/if}
        </div>

        <!-- Banner Image / Video -->
        <div class="w-full md:w-1/2">
          <BlurFade delay={0.3} yOffset={20}>
            {#if video}
              <HeroVideoDialog
                videoSrc={videoEmbedUrl}
                thumbnailSrc={bannerImage || '/images/classroomio-course-img-template.jpg'}
                thumbnailAlt={get(courseData, 'title', 'Course video')}
                animationStyle="from-center"
              />
            {:else}
              <div class="overflow-hidden rounded-xl shadow-2xl">
                <img
                  alt="Course banner"
                  src={bannerImage ? bannerImage : '/images/classroomio-course-img-template.jpg'}
                  class="h-auto w-full rounded-xl object-cover"
                />
              </div>
            {/if}
          </BlurFade>
        </div>
      </div>
    </header>

    <!-- Social Proof Strip -->
    {#if reviews.length > 0 || studentCount > 0 || lessons.length > 0}
      <div class="w-full border-b border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div
          class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-6 px-6 py-4 text-sm md:justify-start"
        >
          {#if averageRating}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <StarIcon size={16} class="fill-yellow-400 text-yellow-400" />
              <span class="font-semibold">{averageRating}</span>
              <span class="text-gray-500 dark:text-gray-400"
                >({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span
              >
            </div>
          {/if}
          {#if studentCount > 0}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <UsersIcon size={16} />
              <span>{studentCount} {studentCount === 1 ? 'student' : 'students'}</span>
            </div>
          {/if}
          {#if lessons.length > 0}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <BookOpenIcon size={16} />
              <span>{pluralize('lesson', lessons.length, true)}</span>
            </div>
          {/if}
          {#if courseData.type}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <ClockIcon size={16} />
              <span>{courseData.type === 'LIVE_CLASS' ? 'Live Class' : 'Self-Paced'}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}

  <!-- Body -->
  <div class="w-full bg-white dark:bg-black">
    <div
      class="mx-auto my-2 flex w-full max-w-6xl flex-col-reverse items-center justify-between px-4 lg:flex-row lg:items-start lg:py-8"
    >
      <!-- Course Details -->
      <div class="w-full max-w-[680px] min-w-[60%] p-3 lg:mr-10">
        <!-- Navigation -->
        <UnderlineTabs.Root bind:value={activeNav} class="ui:bg-background sticky top-0 z-20 py-2">
          <UnderlineTabs.List>
            {#each navItems as navItem (navItem.key)}
              <UnderlineTabs.Trigger value={navItem.key}>
                <a href={resolve(page.url.pathname + navItem.key, {})}>
                  {$t(navItem.label)}
                </a>
              </UnderlineTabs.Trigger>
            {/each}
          </UnderlineTabs.List>
        </UnderlineTabs.Root>

        <!-- Sections - Requirement -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.REQUIREMENT)}
          <NavSection id="requirement">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 mb-3 text-2xl font-semibold">
                {$t('course.navItem.landing_page.requirement')}
              </h3>
              <ul class="list font-light">
                <HTMLRender><SafeHtmlContent content={get(courseData, 'metadata.requirements', '')} /></HTMLRender>
              </ul>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Course Description -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.DESCRIPTION)}
          <NavSection id="description">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 mb-3 text-2xl font-semibold">
                {$t('course.navItem.landing_page.description')}
              </h3>
              <HTMLRender className="dark:text-white text-sm font-light leading-relaxed">
                <SafeHtmlContent content={get(courseData, 'metadata.description', '')} />
              </HTMLRender>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Goal -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.GOALS)}
          <NavSection id="goals">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 mb-3 text-2xl font-semibold">{$t('course.navItem.landing_page.learn')}</h3>
              <ul class="list font-light">
                <HTMLRender><SafeHtmlContent content={get(courseData, 'metadata.goals', '')} /></HTMLRender>
              </ul>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Certificate -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.CERTIFICATE)}
          <NavSection id="certificate">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 text-2xl font-semibold">{$t('course.navItem.landing_page.certificate')}</h3>
              <p class="mb-4 text-sm font-light dark:text-white">
                {$t('course.navItem.landing_page.certificate_text')}
              </p>
              <MagicCard
                gradientColor="#3b82f6"
                gradientOpacity={0.15}
                class="inline-block w-auto border-0 bg-transparent py-0 dark:bg-transparent"
              >
                <Image src={certificate?.templateUrl} alt="certificate template" className="max-h-[215px] w-auto" />
              </MagicCard>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Lessons -->
        {#if !courseData.metadata?.isContentGroupingEnabled}
          <NavSection id="lessons">
            <BlurFade delay={0.1}>
              <div class="mb-3 flex w-full items-center justify-between">
                <h3 class="mt-0 mb-3 text-2xl font-semibold">
                  {$t('course.navItem.landing_page.content')}
                </h3>
                <p class="text-sm font-light dark:text-white">
                  {pluralize('lesson', lessons.length, true)}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                {#each lessons as lesson, index (lesson.id)}
                  <BlurFade delay={0.05 * Math.min(index, 10)}>
                    <div
                      class="rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:border-gray-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                    >
                      <Chip value={getLectureNo(index + 1, '0')} />
                      <p class="ml-2 inline text-xs font-light dark:text-white">
                        {lesson.title}
                      </p>
                    </div>
                  </BlurFade>
                {/each}
              </div>
            </BlurFade>
          </NavSection>
        {:else if courseData.metadata?.isContentGroupingEnabled}
          <NavSection id="lessons">
            <BlurFade delay={0.1}>
              <!-- header -->
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-semibold">{$t('course.navItem.landing_page.course_content')}</h1>
                <span class="text-xs font-normal">
                  {pluralize($t('course.navItem.landing_page.modules'), courseSections.length, true)},
                  {pluralize($t('course.navItem.landing_page.lessons'), totalLessons, true)}
                </span>
              </div>

              {#each courseSections as section, index (section.id)}
                <BlurFade delay={0.05 * Math.min(index, 8)}>
                  <SectionsDisplay
                    exerciseCount={section.exerciseCount}
                    lessonCount={section.lessons?.length}
                    lessons={section.lessons}
                    title={section.title!}
                  />
                </BlurFade>
              {/each}
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Reviews -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.REVIEWS)}
          <NavSection id="reviews">
            <BlurFade delay={0.1}>
              <div class="mb-6 flex items-center gap-3">
                <h2 class="text-2xl font-semibold">
                  {$t('course.navItem.landing_page.reviews')}
                </h2>
                {#if averageRating}
                  <Sparkle
                    text={averageRating}
                    colors={{ first: '#facc15', second: '#f97316' }}
                    sparklesCount={3}
                    class="text-xl font-bold"
                  />
                {/if}
              </div>
            </BlurFade>

            <div class="grid gap-4 sm:grid-cols-2">
              {#each reviews.slice(0, 4) as review, id (review.id)}
                {#if !review.hide}
                  <BlurFade delay={0.1 + id * 0.08}>
                    <div
                      class="flex flex-row items-start gap-3 rounded-lg border border-gray-100 p-4 dark:border-neutral-800"
                    >
                      <!-- image container -->
                      <Avatar.Root class="mt-1 size-10 shrink-0">
                        {#if review.avatar_url}
                          <Avatar.Image src={review.avatar_url} alt={review.name ? review.name : 'Avatar'} />
                        {/if}
                        <Avatar.Fallback>
                          <UserIcon class="ui:size-5 ui:text-muted-foreground" />
                        </Avatar.Fallback>
                      </Avatar.Root>

                      <!-- profile content -->
                      <div class="min-w-0 flex-1">
                        <p class="mb-0.5 font-medium">{review.name}</p>
                        <!-- ratings -->
                        <div class="mb-2 flex items-center gap-0.5">
                          {#each Array(5) as _, i}
                            <StarIcon
                              size={14}
                              class={i < (review.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-neutral-600'}
                            />
                          {/each}
                        </div>
                        <div class="mb-2 overflow-hidden" style:max-height={expandDescription[id] ? 'none' : '60px'}>
                          <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {review.description}
                          </p>
                        </div>
                        {#if !expandDescription[id] && review.description.split(' ').length > 12}
                          <button
                            class="ui:text-primary text-sm font-normal underline"
                            onclick={() => toggleDescription(id)}>See More</button
                          >
                        {/if}
                        {#if expandDescription[id]}
                          <button
                            class="ui:text-primary text-sm font-normal underline"
                            onclick={() => toggleDescription(id)}>See Less</button
                          >
                        {/if}
                      </div>
                    </div>
                  </BlurFade>
                {/if}
              {/each}
            </div>
            {#if reviews.length > 4}
              <Button class="mt-4" variant="outline" onclick={() => ($reviewsModalStore.open = true)}>
                {$t('course.navItem.landing_page.see_all')}
              </Button>
            {/if}

            <!-- Reviews Modal -->
            <Dialog.Root bind:open={$reviewsModalStore.open}>
              <Dialog.Content class="w-9/12">
                <Dialog.Header>
                  <Dialog.Title>{$t('course.navItem.landing_page.reviews_modal.title')}</Dialog.Title>
                </Dialog.Header>
                <div class="flex">
                  <!-- ratings -->
                  <div class="w-1/3">
                    <h2 class="text-xl">
                      {averageRating}
                      {$t('course.navItem.landing_page.reviews_modal.rating')}
                    </h2>
                    <h2 class="mt-2 text-lg font-semibold">
                      {reviews.length}
                      {$t('course.navItem.landing_page.reviews_modal.ratings')}
                    </h2>
                  </div>
                  <!-- reviews -->
                  <div class="flex w-4/6 flex-wrap">
                    {#each reviews as review, id (review.id)}
                      <!-- review -->
                      <div class="my-2 flex w-full flex-row items-start">
                        <!-- image container -->
                        <Avatar.Root class="mt-1 h-10 w-10">
                          {#if review.avatar_url}
                            <Avatar.Image src={review.avatar_url} alt={review.name ? review.name : 'Avatar'} />
                          {/if}
                          <Avatar.Fallback>
                            <UserIcon class="ui:size-5 ui:text-muted-foreground" />
                          </Avatar.Fallback>
                        </Avatar.Root>

                        <!-- profile content -->
                        <div class="w-11/12 pl-2.5">
                          <p class="mb-0.5 font-medium">{review.name}</p>
                          <!-- ratings -->
                          <div class="flex flex-row items-center gap-1">
                            <div class="flex items-center gap-0.5">
                              {#each Array(5) as _, i}
                                <StarIcon
                                  size={14}
                                  class={i < (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-neutral-600'}
                                />
                              {/each}
                            </div>
                            <p class="text-xs text-gray-600">
                              {calDateDiff(review.created_at)}
                            </p>
                          </div>
                          <div
                            class="mb-2 overflow-hidden transition-all"
                            style:max-height={expandDescription[id] ? 'none' : '60px'}
                          >
                            <p class="my-2 text-sm leading-relaxed text-gray-600">
                              {review.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Root>
          </NavSection>
        {/if}

        <!-- Sections - Instructor -->
        <NavSection id="instructor">
          <BlurFade delay={0.1}>
            <h3 class="mt-0 mb-4 text-2xl font-semibold">
              {$t('course.navItem.landing_page.instructor')}
            </h3>
            <div class="mb-4 flex items-center gap-4">
              <img
                alt="Author Avatar"
                class="block h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-neutral-700"
                src={instructorImageUrl}
              />
              <div>
                <p class="text-base font-medium dark:text-white">
                  {instructorName}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {get(instructor, 'role', '')}
                </p>
                {#if get(instructor, 'courseNo', '')}
                  <p class="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <PlayIcon size={14} class="filled" />
                    <span>
                      {get(instructor, 'courseNo', '')}
                      {$t('course.navItem.landing_page.courses')}
                    </span>
                  </p>
                {/if}
              </div>
            </div>

            <p class="text-sm leading-relaxed font-light dark:text-white">
              {get(instructor, 'description', '')}
            </p>
          </BlurFade>
        </NavSection>
      </div>

      <!-- Pricing Details -->
      <PricingSection {courseData} {editMode} bind:startCoursePayment className="target-component" />
    </div>
    {#if !isVisible}
      <PricingSection {courseData} {editMode} bind:startCoursePayment mobile={true} className="w-full" />
    {/if}
  </div>
</div>

<style>
  :global(.list ul li) {
    margin-left: 1rem;
    list-style-type: disc;
  }
</style>
