<script lang="ts">
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Avatar from '@cio/ui/base/avatar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ContentType } from '@cio/utils/constants/content';
  import { Image } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { copyCourseModal, deleteCourseModal } from '$features/course/utils/store';
  import { copyPublicCoursePageUrl, openCoursePreview } from '$features/course/utils/course-preview';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import { buildCoursePlaceholderAvatarUrl } from '$features/course/utils/course-list-row-utils';
  import CourseContentIcon from './course-content-icon.svelte';
  import CoursePublicBadge from './course-public-badge.svelte';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import CopyIcon from '@lucide/svelte/icons/copy';

  interface Tag {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  }

  type ColumnKey = 'published' | 'tags' | 'students' | 'actions';

  const COLUMN_TRACKS: [string, string][] = [
    ['banner', '7rem'],
    ['title', 'minmax(0, 2fr)'],
    ['published', '5.5rem'],
    ['tags', 'minmax(0, 2fr)'],
    ['content', '4.5rem'],
    ['students', '6rem'],
    ['actions', '7rem']
  ];

  interface Props {
    id: string;
    slug?: string;
    title: string;
    logo?: string | null;
    type?: string | null;
    description?: string;
    isPublished?: boolean;
    lessonCount?: number;
    exerciseCount?: number;
    totalStudents?: number;
    updatedAt?: string | null;
    tags?: Tag[];
    isExplore?: boolean;
    isLMS?: boolean;
    hiddenColumns?: ColumnKey[];
    onExploreClick?: () => void;
  }

  let {
    id,
    slug = '',
    title,
    logo = null,
    type,
    description = '',
    isPublished = false,
    lessonCount = 0,
    exerciseCount = 0,
    totalStudents = 0,
    updatedAt,
    tags = [],
    isExplore = false,
    isLMS = false,
    hiddenColumns = [],
    onExploreClick
  }: Props = $props();

  const titleInitial = $derived(title.trim().charAt(0).toUpperCase() || 'C');

  const bannerImage = $derived(logo?.trim() ? logo : '/images/classroomio-course-img-template.jpg');

  const showPublicCourseLinks = $derived(isPublished && type === 'PUBLIC' && slug.trim().length > 0);

  const hidden = $derived(new Set<string>(hiddenColumns));

  const MAX_VISIBLE_TAGS = 3;
  const visibleTags = $derived(tags.slice(0, MAX_VISIBLE_TAGS));
  const remainingTagCount = $derived(Math.max(0, tags.length - MAX_VISIBLE_TAGS));

  const showActionsColumn = $derived(
    !hidden.has('actions') && (!isLMS || (isLMS && showPublicCourseLinks) || (isLMS && isExplore))
  );

  const gridTemplateColumns = $derived(
    COLUMN_TRACKS.filter(([key]) => {
      if (hidden.has(key)) return false;
      if (key === 'actions') return showActionsColumn;
      return true;
    })
      .map(([, track]) => track)
      .join(' ')
  );

  const studentPlaceholderAvatarUrls = $derived.by(() => [
    buildCoursePlaceholderAvatarUrl(`${id}:student:0`),
    buildCoursePlaceholderAvatarUrl(`${id}:student:1`)
  ]);

  const emptyStateAvatarUrl = $derived(buildCoursePlaceholderAvatarUrl(`${id}:student:empty`));

  const typeLabel = $derived(type ? $t(`course.navItem.settings.${type.toLowerCase()}`) : null);

  const updatedLabel = $derived.by(() => {
    if (!updatedAt) return null;
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return null;
    return `Updated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  function handleRowClick() {
    if (isExplore && onExploreClick) {
      onExploreClick();
      return;
    }
    if (isExplore) {
      goto(resolve(`/course/${slug}`, {}));
      return;
    }
    if (isLMS) {
      goto(resolve(`/courses/${id}/lessons?next=true`, {}));
      return;
    }
    goto(resolve(`/courses/${id}`, {}));
  }

  function handleOpen(e: MouseEvent) {
    e.stopPropagation();
    goto(resolve(`/courses/${id}`, {}));
  }

  function handleClone(e: MouseEvent) {
    e.stopPropagation();
    $copyCourseModal.open = true;
    $copyCourseModal.id = id;
    $copyCourseModal.title = title;
    $copyCourseModal.description = description;
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    $deleteCourseModal.open = true;
    $deleteCourseModal.id = id;
    $deleteCourseModal.title = title;
  }

  async function handleCopyCourseUrl() {
    await copyPublicCoursePageUrl(slug, $currentOrgDomain);
  }
</script>

<ResourceListRow.Root
  variant="default"
  size="sm"
  align="start"
  class="cursor-pointer py-4!"
  onclick={handleRowClick}
  role="row"
>
  <div
    class="grid w-full grid-cols-1 items-start gap-x-3 gap-y-2 @3xl:grid-cols-[var(--row-cols)]"
    style="--row-cols: {gridTemplateColumns}"
  >
    <!-- Banner -->
    <div
      class="ui:border-border bg-muted relative size-28 shrink-0 overflow-hidden rounded-md border"
      aria-hidden="true"
    >
      <Image src={bannerImage} alt="" className="h-full w-full object-cover" />
    </div>

    <!-- Title / type / updated -->
    <div class="flex min-w-0 flex-col gap-0.5">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <p class="line-clamp-2 min-w-0 flex-1 text-base">{title}</p>
        {#if type === 'PUBLIC'}
          <CoursePublicBadge class="shrink-0" />
        {/if}
      </div>
      {#if typeLabel}
        <p class="ui:text-muted-foreground mt-0.5 text-sm">{typeLabel}</p>
      {/if}
      {#if updatedLabel}
        <p class="ui:text-muted-foreground mt-0.5 text-xs">{updatedLabel}</p>
      {/if}
    </div>

    <!-- Published badge -->
    {#if !hidden.has('published')}
      <div>
        {#if isPublished}
          <Badge variant="success" class="whitespace-nowrap">
            {$t('courses.course_card.published')}
          </Badge>
        {:else}
          <Badge variant="secondary" class="whitespace-nowrap">
            {$t('courses.course_card.unpublished')}
          </Badge>
        {/if}
      </div>
    {/if}

    <!-- Tags -->
    {#if !hidden.has('tags')}
      <div class="flex min-w-0 flex-wrap items-center gap-1">
        {#if tags.length === 0}
          <span class="ui:text-muted-foreground text-xs">—</span>
        {:else}
          {#each visibleTags as tag (tag.id)}
            <Badge variant="outline" class="max-w-[140px] truncate">
              <span
                class="ui:bg-primary/60 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={tag.color ? `background-color: ${tag.color}` : undefined}
                aria-hidden="true"
              ></span>
              {tag.name}
            </Badge>
          {/each}
          {#if remainingTagCount > 0}
            <Badge variant="secondary" class="shrink-0 tabular-nums">+{remainingTagCount}</Badge>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- Lessons / exercises -->
    <div class="flex flex-col gap-1 tabular-nums">
      <p class="flex items-center gap-1.5 text-sm" aria-label="{lessonCount} lessons">
        <CourseContentIcon type={ContentType.Lesson} size={14} />
        <span class="font-medium">{lessonCount}</span>
      </p>
      <p class="flex items-center gap-1.5 text-sm" aria-label="{exerciseCount} exercises">
        <CourseContentIcon type={ContentType.Exercise} size={14} />
        <span class="font-medium">{exerciseCount}</span>
      </p>
    </div>

    <!-- Students -->
    {#if !hidden.has('students')}
      <div class="flex items-center gap-1">
        {#if totalStudents > 0}
          {#if totalStudents < 3}
            <div class="flex items-center gap-1">
              <Avatar.Root class="ui:border-background size-6 border-2">
                <Avatar.Image src={studentPlaceholderAvatarUrls[0]} alt="" loading="lazy" decoding="async" />
                <Avatar.Fallback aria-hidden="true">
                  {titleInitial}
                </Avatar.Fallback>
              </Avatar.Root>
              <p class="text-xs tabular-nums">{totalStudents}</p>
            </div>
          {:else}
            <div class="flex -space-x-2">
              {#each studentPlaceholderAvatarUrls as avatarUrl, slotIndex (slotIndex)}
                <Avatar.Root class="ui:border-background size-6 border-2">
                  <Avatar.Image src={avatarUrl} alt="" loading="lazy" decoding="async" />
                  <Avatar.Fallback aria-hidden="true">
                    {titleInitial}
                  </Avatar.Fallback>
                </Avatar.Root>
              {/each}
              <Avatar.Root class="ui:border-background size-6 border-2">
                <Avatar.Fallback class="text-[10px]">+{totalStudents - 2}</Avatar.Fallback>
              </Avatar.Root>
            </div>
          {/if}
        {:else}
          <Avatar.Root class="size-6">
            <Avatar.Image src={emptyStateAvatarUrl} alt="" loading="lazy" decoding="async" />
            <Avatar.Fallback aria-hidden="true">
              {titleInitial}
            </Avatar.Fallback>
          </Avatar.Root>
          <p class="text-xs">0</p>
        {/if}
      </div>
    {/if}

    <!-- Actions -->
    {#if showActionsColumn}
      <div class="flex justify-end">
        {#if isLMS && isExplore}
          <Button
            variant="outline"
            size="sm"
            onclick={(e) => {
              e.stopPropagation();
              onExploreClick?.();
            }}
          >
            {$t('courses.course_card.learn_more')}
          </Button>
        {:else}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  aria-label={$t('courses.course_card.actions_menu_aria')}
                  onclick={(e) => e.stopPropagation()}
                >
                  <EllipsisVerticalIcon class="size-4" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {#if showPublicCourseLinks}
                <DropdownMenu.Item
                  onclick={() =>
                    openCoursePreview({
                      courseId: id,
                      courseSlug: slug,
                      currentOrgDomain: $currentOrgDomain
                    })}
                >
                  <ExternalLinkIcon class="mr-2 size-4" />
                  {$t('courses.course_card.context_menu.open_public_course')}
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => void handleCopyCourseUrl()}>
                  <CopyIcon class="mr-2 size-4" />
                  {$t('courses.course_card.context_menu.copy_course_url')}
                </DropdownMenu.Item>
              {/if}
              {#if !isLMS}
                {#if showPublicCourseLinks}
                  <DropdownMenu.Separator />
                {/if}
                <DropdownMenu.Item onclick={handleOpen}>
                  {$t('courses.course_card.context_menu.open')}
                </DropdownMenu.Item>
                <DropdownMenu.Item onclick={handleClone}>
                  {$t('courses.course_card.context_menu.clone')}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item variant="destructive" onclick={handleDelete}>
                  {$t('courses.course_card.context_menu.delete')}
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    {/if}
  </div>
</ResourceListRow.Root>
