<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import HTMLRender from '$features/ui/html-render.svelte';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import XIcon from '@lucide/svelte/icons/x';
  import { t } from '$lib/utils/functions/translations';
  import { calcCourseDiscount, isCourseFree } from '$lib/utils/functions/course';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import type { RecommendedCourses } from '$features/course/types';
  import pluralize from 'pluralize';

  interface Props {
    course: RecommendedCourses[number];
    open: boolean;
  }

  let { course, open = $bindable(false) }: Props = $props();

  type CourseMetadata = {
    allowNewStudent?: boolean;
    discount?: number;
    showDiscount?: boolean;
    requirements?: string;
  };

  const metadata = $derived(course.metadata as CourseMetadata | null);
  const discount = $derived(metadata?.discount ?? 0);
  const calculatedCost = $derived(calcCourseDiscount(discount, course.cost || 0, !!metadata?.showDiscount));
  const isFree = $derived(isCourseFree(calculatedCost));
  const allowNewStudent = $derived(metadata?.allowNewStudent !== false);
  const requirements = $derived(metadata?.requirements?.trim() || null);
  const formatter = $derived(getCurrencyFormatter(course.currency ?? 'USD'));

  function handleJoinCourse() {
    if (!course.slug) return;

    if (isFree) {
      goto(`/course/${course.slug}/enroll`);
    } else {
      goto(`/course/${course.slug}`);
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="ui:p-0 overflow-hidden sm:max-w-2xl" showCloseButton={false}>
    <div class="relative overflow-hidden rounded-md">
      <img
        src={course.logo || DEFAULT_COURSE_BANNER_IMAGE}
        alt={course.title}
        class="aspect-video w-full object-cover"
      />
      <Dialog.Close
        class="ui:absolute ui:top-3 ui:right-3 ui:inline-flex ui:size-8 ui:items-center ui:justify-center ui:rounded-md ui:bg-secondary ui:text-secondary-foreground ui:hover:bg-secondary/80 ui:transition-colors ui:cursor-pointer"
      >
        <XIcon class="ui:size-4" />
        <span class="ui:sr-only">Close</span>
      </Dialog.Close>
    </div>

    <div class="max-h-72 overflow-y-auto px-6 py-4">
      <h2 class="text-xl font-semibold tracking-tight">{course.title}</h2>

      {#if course.description}
        <p class="ui:text-muted-foreground mt-2 text-sm leading-relaxed">{course.description}</p>
      {/if}

      <div class="ui:text-muted-foreground mt-4 flex items-center gap-4 text-sm">
        <span class="flex items-center gap-1.5">
          <BookOpenIcon class="size-4" />
          {course.lessonCount ?? 0}
          {$t('courses.course_card.lessons_number')}
        </span>
        <span>
          {pluralize($t('courses.course_card.exercise'), course.exerciseCount ?? 0, true)}
        </span>
      </div>

      {#if requirements}
        <div class="mt-4">
          <h3 class="text-sm font-semibold">{$t('course.navItem.landing_page.requirement')}</h3>
          <HTMLRender className="text-sm mt-1" disableMaxWidth={true}>
            <SafeHtmlContent content={requirements} />
          </HTMLRender>
        </div>
      {/if}
    </div>

    <div class="ui:border-t ui:bg-card sticky bottom-0 flex items-center justify-between px-6 py-4" data-sticky="true">
      <div>
        {#if allowNewStudent}
          <p class="text-lg font-bold">
            {formatter.format(calculatedCost)}
            {#if isFree}
              <span class="text-sm font-normal">
                ({$t('course.navItem.landing_page.pricing_section.free')})
              </span>
            {/if}
          </p>
          {#if metadata?.showDiscount && !isFree}
            <p class="ui:text-muted-foreground text-sm line-through">
              {formatter.format(course.cost ?? 0)}
            </p>
          {/if}
        {:else}
          <p class="ui:text-muted-foreground text-sm">
            {$t('course.navItem.landing_page.pricing_section.not_accepting')}
          </p>
        {/if}
      </div>

      <Button onclick={handleJoinCourse} disabled={!allowNewStudent}>
        {isFree
          ? $t('course.navItem.landing_page.pricing_section.enroll')
          : $t('course.navItem.landing_page.pricing_section.buy')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
