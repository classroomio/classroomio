<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import XIcon from '@lucide/svelte/icons/x';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { learnerPathStore } from '$features/learning-path/api/learning-path.svelte';
  import { getPublicPathPageUrl } from '$features/learning-path/utils/path-preview';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { isPathPaid } from '@cio/utils/validation/learning-path';
  import pluralize from 'pluralize';

  export interface PathPreviewItem {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    coverImage?: string | null;
    courseCount: number;
    cost?: number | null;
    currency?: string | null;
    selfEnrollment?: boolean | null;
    paymentEnabled?: boolean | null;
    href: string;
    enrolled: boolean;
  }

  interface Props {
    path: PathPreviewItem;
    open: boolean;
  }

  let { path, open = $bindable(false) }: Props = $props();

  const cost = $derived(path.cost ?? 0);
  const paid = $derived(isPathPaid(path.cost, { paymentEnabled: path.paymentEnabled ?? undefined }));
  const isFree = $derived(!paid);
  const displayCost = $derived(paid ? cost : 0);
  const selfEnrollmentAllowed = $derived(path.selfEnrollment !== false);
  const publicSiteUrl = $derived(path.slug ? getPublicPathPageUrl(path.slug) : '');
  const formatter = $derived(getCurrencyFormatter(path.currency ?? 'USD'));
  const detail = $derived(learnerPathStore.publicPathDetail);
  const detailCourses = $derived(detail?.courses ?? []);

  $effect(() => {
    if (open && path.slug) {
      learnerPathStore.loadPublicPathDetail(path.slug);
    }

    if (!open) {
      learnerPathStore.clearPublicPathDetail();
    }
  });

  async function handleEnroll() {
    const enrolled = await learnerPathStore.enroll(path.id);

    if (enrolled) {
      open = false;
      goto(path.href);
    } else {
      snackbar.error('course.navItem.certificates.unexpected_error');
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl!"
    showCloseButton={false}
  >
    <div class="relative shrink-0 overflow-hidden">
      <img
        src={path.coverImage || DEFAULT_COURSE_BANNER_IMAGE}
        alt={path.name}
        class="aspect-video w-full object-cover"
      />
      <Dialog.Close
        class="ui:bg-secondary ui:text-secondary-foreground ui:hover:bg-secondary/80 absolute top-3 right-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors"
      >
        <XIcon class="size-4" />
        <span class="sr-only">Close</span>
      </Dialog.Close>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
      <h2 class="text-xl font-semibold tracking-tight">{path.name}</h2>

      {#if path.description}
        <p class="ui:text-muted-foreground mt-2 text-sm leading-relaxed">{path.description}</p>
      {/if}

      <div class="ui:text-muted-foreground mt-4 flex items-center gap-4 text-sm">
        <span class="flex items-center gap-1.5">
          <BookOpenIcon class="size-4" />
          {path.courseCount}
          {path.courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
        </span>
      </div>

      {#if learnerPathStore.isLoadingPublicPathDetail}
        <div class="flex items-center justify-center py-8">
          <Spinner />
        </div>
      {:else if detailCourses.length > 0}
        <div class="mt-5">
          <h3 class="text-sm font-semibold">{$t('learningPath.preview.courses_heading')}</h3>
          <ul class="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
            {#each detailCourses as course (course.courseId)}
              <li class="ui:border-border flex items-center gap-3 rounded-lg border p-2.5">
                <img
                  src={course.coverImage || DEFAULT_COURSE_BANNER_IMAGE}
                  alt={course.title}
                  loading="lazy"
                  class="h-12 w-20 shrink-0 rounded object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{course.title}</p>
                  {#if course.description}
                    <p class="ui:text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {course.description}
                    </p>
                  {/if}
                  <p class="ui:text-muted-foreground mt-1 text-xs">
                    {course.lessonsCount ?? 0}
                    {$t('courses.course_card.lessons_number')} · {pluralize(
                      $t('courses.course_card.exercise'),
                      course.exercisesCount ?? 0,
                      true
                    )}
                  </p>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex shrink-0 flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
      <div>
        {#if selfEnrollmentAllowed}
          <p class="text-lg font-bold">
            {formatter.format(displayCost)}
            {#if isFree}
              <span class="text-sm font-normal">
                ({$t('course.navItem.landing_page.pricing_section.free')})
              </span>
            {/if}
          </p>
        {:else}
          <p class="ui:text-muted-foreground text-sm">
            {$t('course.navItem.landing_page.pricing_section.not_accepting')}
          </p>
        {/if}
      </div>

      {#if path.enrolled}
        <Button href={path.href}>{$t('explore.view_learning_path')}</Button>
      {:else if !selfEnrollmentAllowed}
        <Button disabled>{$t('learningPath.detail.enroll')}</Button>
      {:else if !isFree && publicSiteUrl}
        <Button href={publicSiteUrl}>{$t('course.navItem.landing_page.pricing_section.buy')}</Button>
      {:else}
        <Button onclick={handleEnroll} disabled={learnerPathStore.isLoading}>
          {$t('learningPath.detail.enroll')}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
