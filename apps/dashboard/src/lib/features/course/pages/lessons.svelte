<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Empty } from '@cio/ui/custom/empty';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ContentList from '$features/course/components/lesson/content-list.svelte';
  import ContentSectionList from '$features/course/components/lesson/content-section-list.svelte';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { getCourseContent } from '$features/course/utils/content';
  import { ContentType } from '@cio/utils/constants/content';

  interface Props {
    courseId: string;
    reorder?: boolean;
  }

  let { courseId, reorder = $bindable(false) }: Props = $props();

  const query = new URLSearchParams(page.url.search);

  const contentData = $derived(getCourseContent(courseApi.course));
  const contentLength = $derived(contentData.grouped ? contentData.sections.length : contentData.items.length);
  const contentItems = $derived(
    contentData.grouped ? contentData.sections.flatMap((section) => section.items) : contentData.items
  );
  const navigableContentItems = $derived(
    contentItems.filter((item) => item.type === ContentType.Lesson || item.type === ContentType.Exercise)
  );

  let isFetching: boolean = $state(false);
  let hasHandledNext = $state(false);

  const isCourseLoadedForThisPage = $derived(courseApi.course?.id === courseId);
  const canResolveNext = $derived(isCourseLoadedForThisPage && navigableContentItems.length > 0 && !hasHandledNext);

  function findFirstIncompleteContent() {
    return navigableContentItems.find((item) => !item.isComplete && item.isUnlocked === true);
  }

  $effect(() => {
    if (!canResolveNext || isFetching || query.get('next') !== 'true') return;

    hasHandledNext = true;
    const incompleteContent = findFirstIncompleteContent();
    if (incompleteContent) {
      if (incompleteContent.type === ContentType.Lesson) {
        goto(`/courses/${courseId}/lessons/${incompleteContent.id}`);
      } else {
        goto(`/courses/${courseId}/exercises/${incompleteContent.id}`);
      }
    } else {
      goto(`/courses/${courseId}/lessons`);
    }
  });

  const shouldShowNextPlaceholder = $derived(query.get('next') === 'true');
</script>

{#if shouldShowNextPlaceholder}
  <Empty
    title={$t('course.navItem.lessons.no_lesson')}
    description={$t('course.navItem.lessons.share_your_knowledge')}
    icon={BookOpenIcon}
    variant="page"
  />
{:else if contentLength > 0}
  {#if reorder}
    <p class="text-center text-xs text-gray-400 italic dark:text-white">
      {$t('course.navItem.lessons.drag')}
    </p>
  {/if}

  {#if contentData.grouped}
    <ContentSectionList {reorder} />
  {:else}
    <ContentList {reorder} />
  {/if}
{:else}
  <Empty
    title={$t('course.navItem.lessons.body_header')}
    description={$t('course.navItem.lessons.body_content')}
    icon={BookOpenIcon}
    variant="page"
  />
{/if}
