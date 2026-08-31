<script lang="ts">
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Avatar from '@cio/ui/base/avatar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { cn } from '@cio/ui/tools';
  import { ContentType } from '@cio/utils/constants/content';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Image } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { buildCoursePlaceholderAvatarUrl } from '$features/course/utils/course-list-row-utils';
  import CoursePublicBadge from './course-public-badge.svelte';
  import CourseContextMenuContent from './course-context-menu-content.svelte';
  import CourseContentIcon from './course-content-icon.svelte';

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
  const MAX_MOBILE_VISIBLE_TAGS = 2;
  const MAX_VISIBLE_STUDENTS = 2;
  const visibleTags = $derived(tags.slice(0, MAX_VISIBLE_TAGS));
  const visibleMobileTags = $derived(tags.slice(0, MAX_MOBILE_VISIBLE_TAGS));
  const remainingTagCount = $derived(Math.max(0, tags.length - MAX_VISIBLE_TAGS));
  const remainingMobileTagCount = $derived(Math.max(0, tags.length - MAX_MOBILE_VISIBLE_TAGS));

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

  const typeLabel = $derived(type ? $t(`course.navItem.settings.${type.toLowerCase()}`) : null);

  const updatedDateString = $derived.by(() => {
    if (!updatedAt) return null;
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  const updatedLabel = $derived(updatedDateString ? `Updated ${updatedDateString}` : null);

  const courseUrl = $derived.by(() => {
    if (isExplore && onExploreClick) {
      return undefined;
    }

    if (isExplore) {
      if (!slug.trim()) {
        return undefined;
      }

      return resolve(`/course/${slug}`, {});
    }

    if (isLMS) {
      return resolve(`/courses/${id}/lessons?next=true`, {});
    }

    return resolve(`/courses/${id}`, {});
  });

  function handleRowClick() {
    if (isExplore && onExploreClick) {
      onExploreClick();
      return;
    }

    if (!courseUrl) {
      return;
    }

    goto(courseUrl);
  }

  function handleRowKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleRowClick();
  }

  function stopRowNavigation(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
</script>

{#snippet tagBadge(tag: Tag)}
  <Badge
    variant="outline"
    class="max-w-35 truncate rounded-full px-1.5! text-[10px]! font-medium @3xl:px-2! @3xl:text-xs!"
  >
    <span
      class="ui:bg-primary/60 inline-block size-1.5 shrink-0 rounded-full"
      style={tag.color ? `background-color: ${tag.color}` : undefined}
      aria-hidden="true"
    ></span>
    {tag.name}
  </Badge>
{/snippet}

{#snippet overflowBadge(count: number)}
  <Badge
    variant="secondary"
    class="shrink-0 px-1.5! text-[9.5px]! font-bold tabular-nums @3xl:px-2! @3xl:text-xs! @3xl:font-medium"
  >
    +{count}
  </Badge>
{/snippet}

{#snippet publishedBadge()}
  <Badge
    variant={isPublished ? 'success' : 'secondary'}
    class="px-1.5! text-[9.5px]! whitespace-nowrap @3xl:px-2! @3xl:text-xs!"
  >
    {isPublished ? $t('courses.course_card.published') : $t('courses.course_card.unpublished')}
  </Badge>
{/snippet}

{#snippet studentAvatarStack(isDesktop = false)}
  {@const avatarSizeClass = isDesktop ? 'size-6!' : 'size-4.5!'}
  {@const overlapClass = isDesktop ? '-ml-2' : '-ml-1.5'}

  <div class={cn('flex items-center', isDesktop ? 'hidden @3xl:flex' : '@3xl:hidden')}>
    <div class="flex items-center">
      {#if totalStudents === 0}
        <div
          class={cn('ui:border-background ui:bg-muted-foreground/20 shrink-0 rounded-full border-2', avatarSizeClass)}
        ></div>
      {:else}
        {#each studentPlaceholderAvatarUrls.slice(0, Math.min(MAX_VISIBLE_STUDENTS, totalStudents)) as avatarUrl, index (index)}
          <div class={cn('flex items-center', index > 0 && overlapClass)}>
            <Avatar.Root class={cn('ui:border-background border-2', avatarSizeClass)}>
              <Avatar.Image src={avatarUrl} alt="" loading="lazy" decoding="async" />
              <Avatar.Fallback aria-hidden="true" class={isDesktop ? 'text-xs' : 'text-[8px]'}>
                {titleInitial}
              </Avatar.Fallback>
            </Avatar.Root>
          </div>
        {/each}
        {#if totalStudents > MAX_VISIBLE_STUDENTS}
          <div class={overlapClass}>
            <Avatar.Root class={cn('ui:border-background border-2', avatarSizeClass)}>
              <Avatar.Fallback class={cn('font-bold', isDesktop ? 'text-[10px]' : 'text-[8px]')}>
                +{totalStudents - MAX_VISIBLE_STUDENTS}
              </Avatar.Fallback>
            </Avatar.Root>
          </div>
        {/if}
      {/if}
    </div>
    {#if totalStudents <= 1}
      <span
        class={cn('ui:text-foreground font-semibold tabular-nums', isDesktop ? 'ml-1 text-xs' : 'ml-1.5 text-[11.5px]')}
      >
        {totalStudents}
      </span>
    {/if}
  </div>
{/snippet}

{#snippet rowContent()}
  <div
    class="flex w-full items-start gap-2.5 @3xl:grid @3xl:grid-cols-(--row-cols) @3xl:gap-x-3"
    style="--row-cols: {gridTemplateColumns}"
  >
    <!-- Column 1: Banner -->
    <div
      class="ui:border-border ui:bg-muted relative size-11 shrink-0 overflow-hidden rounded-md border @3xl:size-28"
      aria-hidden="true"
    >
      <Image src={bannerImage} alt="" className="h-full w-full object-cover" />
    </div>

    <!-- Mobile Middle Content (flex-1) / Desktop Columns 2-6 (@3xl:contents) -->
    <div class="flex min-w-0 flex-1 flex-col @3xl:contents">
      <!-- Column 2: Title & Subtitle -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <div class="flex min-w-0 items-center gap-1.5">
          <p
            class="ui:text-foreground min-w-0 flex-1 truncate text-[13.5px] @3xl:line-clamp-2 @3xl:text-base @3xl:wrap-break-word @3xl:whitespace-normal"
          >
            {title}
          </p>
          {#if type === 'PUBLIC'}
            <CoursePublicBadge class="shrink-0 px-1.5! text-[9.5px]! @3xl:px-2! @3xl:text-xs!" />
          {/if}

          {#if !hidden.has('published')}
            <div class="@3xl:hidden">
              {@render publishedBadge()}
            </div>
          {/if}
        </div>

        <!-- Mobile Tags (below Title on mobile) -->
        {#if !hidden.has('tags') && tags.length > 0}
          <div class="mt-1 mb-1 flex flex-wrap items-center gap-1 @3xl:hidden">
            {#each visibleMobileTags as tag (tag.id)}
              {@render tagBadge(tag)}
            {/each}
            {#if remainingMobileTagCount > 0}
              {@render overflowBadge(remainingMobileTagCount)}
            {/if}
          </div>
        {/if}

        <!-- Mobile Subtitle (type & updated) -->
        {#if typeLabel || updatedDateString}
          <p class="ui:text-muted-foreground text-[11px] @3xl:hidden">
            {typeLabel ? typeLabel : ''}{typeLabel && updatedDateString
              ? `, updated ${updatedDateString}`
              : updatedDateString
                ? `Updated ${updatedDateString}`
                : ''}
          </p>
        {/if}

        <!-- Desktop Subtitle (type & updated) -->
        <div class="hidden @3xl:block">
          {#if typeLabel}
            <p class="ui:text-muted-foreground mt-0.5 text-sm">{typeLabel}</p>
          {/if}
          {#if updatedLabel}
            <p class="ui:text-muted-foreground mt-0.5 text-xs">{updatedLabel}</p>
          {/if}
        </div>
      </div>

      <!-- Column 3: Published Badge -->
      {#if !hidden.has('published')}
        <div class="hidden @3xl:block">
          {@render publishedBadge()}
        </div>
      {/if}

      <!-- Column 4: Tags -->
      {#if !hidden.has('tags')}
        <div class="hidden min-w-0 flex-wrap items-center gap-1 @3xl:flex">
          {#if tags.length === 0}
            <span class="ui:text-muted-foreground text-xs">—</span>
          {:else}
            {#each visibleTags as tag (tag.id)}
              {@render tagBadge(tag)}
            {/each}
            {#if remainingTagCount > 0}
              {@render overflowBadge(remainingTagCount)}
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Mobile Metrics Row / Desktop Columns 5-6 (@3xl:contents) -->
      <div class="mt-1.5 flex items-center gap-3 text-[11px] @3xl:mt-0 @3xl:contents">
        <!-- Column 5: Lessons & Exercises -->
        <div class="flex items-center gap-3 tabular-nums @3xl:flex-col @3xl:items-start @3xl:gap-1">
          <p
            class="ui:text-foreground flex items-center gap-1 text-[11px] @3xl:gap-1.5 @3xl:text-sm"
            aria-label="{lessonCount} lessons"
          >
            <CourseContentIcon type={ContentType.Lesson} className="size-3 @3xl:size-3.5 [&>svg]:size-full!" />
            <span class="font-medium">{lessonCount}</span>
          </p>
          <p
            class="ui:text-foreground flex items-center gap-1 text-[11px] @3xl:gap-1.5 @3xl:text-sm"
            aria-label="{exerciseCount} exercises"
          >
            <CourseContentIcon type={ContentType.Exercise} className="size-3 @3xl:size-3.5 [&>svg]:size-full!" />
            <span class="font-medium">{exerciseCount}</span>
          </p>
        </div>

        <!-- Column 6: Students AvatarStack -->
        {#if !hidden.has('students')}
          <div class="flex items-center">
            {@render studentAvatarStack(false)}
            {@render studentAvatarStack(true)}
          </div>
        {/if}
      </div>
    </div>

    <!-- Column 7: Actions -->
    {#if showActionsColumn}
      <div class="-mt-0.5 -mr-1 shrink-0 @3xl:mt-0 @3xl:mr-0 @3xl:flex @3xl:justify-end">
        {#if isLMS && isExplore}
          <Button
            variant="outline"
            size="sm"
            onclick={(event) => {
              stopRowNavigation(event);
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
                  class="ui:text-muted-foreground hover:ui:text-foreground size-7 p-0.5 @3xl:size-8"
                  aria-label={$t('courses.course_card.actions_menu_aria')}
                  onclick={stopRowNavigation}
                >
                  <EllipsisVerticalIcon class="size-3.5 @3xl:size-4" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {#if isLMS}
                <CourseContextMenuContent
                  {id}
                  {title}
                  {description}
                  {isPublished}
                  courseType={type}
                  {slug}
                  lmsPublicQuickOnly={true}
                />
              {:else}
                <CourseContextMenuContent
                  {id}
                  {title}
                  {description}
                  {isPublished}
                  courseType={type}
                  {slug}
                  includeOpen={true}
                  hideOrgActions={false}
                />
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<ResourceListRow.Root
  variant="default"
  size="sm"
  align="start"
  class="cursor-pointer px-3! py-2.5! @3xl:px-4! @3xl:py-3!"
>
  {#snippet child({ props })}
    {#if courseUrl}
      <a href={courseUrl} {...props} class={cn('block', props.class as string)}>
        {@render rowContent()}
      </a>
    {:else}
      <div
        {...props}
        class={cn('block', props.class as string)}
        role="button"
        tabindex="0"
        onclick={handleRowClick}
        onkeydown={handleRowKeydown}
      >
        {@render rowContent()}
      </div>
    {/if}
  {/snippet}
</ResourceListRow.Root>
