<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
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
  <Dialog.Content class="overflow-hidden p-0 sm:max-w-2xl">
    <div class="aspect-video w-full overflow-hidden">
      <img src={course.logo || DEFAULT_COURSE_BANNER_IMAGE} alt={course.title} class="h-full w-full object-cover" />
    </div>

    <div class="max-h-80 overflow-y-auto px-6 py-4">
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
          <p class="ui:text-muted-foreground mt-1 text-sm leading-relaxed">{requirements}</p>
        </div>
      {/if}
    </div>

    <div class="ui:border-t ui:bg-card sticky bottom-0 flex items-center justify-between px-6 py-4">
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
