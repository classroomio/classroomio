<script lang="ts">
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Avatar from '@cio/ui/base/avatar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { cn } from '@cio/ui/tools';
  import { Image } from '$features/ui';
  import { locale, t } from '$lib/utils/functions/translations';
  import { buildCoursePlaceholderAvatarUrl } from '$features/course/utils/course-list-row-utils';
  import type { LearningPathSummary } from '../utils/types';
  import { LearningEntityIcon } from '$features/ui';
  import PathContextMenuContent from './path-context-menu-content.svelte';

  interface Props {
    path: LearningPathSummary;
    onDelete?: (id: string, name: string) => void;
  }

  let { path, onDelete }: Props = $props();

  const isPublished = $derived(path.isPublished ?? false);
  const bannerImage = $derived(path.coverImage || '/images/classroomio-course-img-template.jpg');
  const titleInitial = $derived(path.name.trim().charAt(0).toUpperCase() || 'P');
  const courseCount = $derived(path.courseCount || 0);
  const totalStudents = $derived(path.memberCount || 0);

  const isDraftSetup = $derived(!isPublished && totalStudents === 0);
  const pathUrl = $derived(isDraftSetup ? `/paths/${path.publicId}/setup` : `/paths/${path.publicId}`);

  const MAX_VISIBLE_STUDENTS = 2;

  const studentPlaceholderAvatarUrls = $derived.by(() => [
    buildCoursePlaceholderAvatarUrl(`${path.id}:student:0`),
    buildCoursePlaceholderAvatarUrl(`${path.id}:student:1`)
  ]);

  const updatedDateString = $derived.by(() => {
    if (!path.updatedAt) return null;

    const parsedDate = new Date(path.updatedAt);
    if (isNaN(parsedDate.getTime())) return null;

    return parsedDate.toLocaleDateString($locale || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  const updatedLabel = $derived(
    updatedDateString ? $t('learningPath.card.updated_at', { date: updatedDateString }) : null
  );

  const COLUMN_TRACKS: [string, string][] = [
    ['banner', '7rem'],
    ['title', 'minmax(0, 2fr)'],
    ['published', '5.5rem'],
    ['courses', '4.5rem'],
    ['students', '6rem'],
    ['actions', '4rem']
  ];

  const pathLabel = $derived($t('learningPath.card.badge'));

  const gridTemplateColumns = $derived(COLUMN_TRACKS.map(([, track]) => track).join(' '));

  function stopNavigation(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
</script>

{#snippet publishedBadge()}
  <Badge
    variant={isPublished ? 'success' : 'secondary'}
    class="px-1.5! text-[9.5px]! whitespace-nowrap @3xl:px-2! @3xl:text-xs!"
  >
    {isPublished ? $t('learningPath.card.published') : $t('learningPath.card.unpublished')}
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
    <!-- Column 1: Banner with Card Stack Underlayer -->
    <div class="relative shrink-0">
      <div
        class="ui:border-border ui:bg-card/70 absolute inset-0 -z-10 translate-x-1 translate-y-1 rounded-md border"
        aria-hidden="true"
      ></div>
      <div
        class="ui:border-border ui:bg-muted relative size-11 shrink-0 overflow-hidden rounded-md border @3xl:size-28"
        aria-hidden="true"
      >
        <Image src={bannerImage} alt="" className="h-full w-full object-cover" />
      </div>
    </div>

    <!-- Mobile Middle Content / Desktop Columns -->
    <div class="flex min-w-0 flex-1 flex-col @3xl:contents">
      <!-- Column 2: Title & Subtitle -->
      <div class="flex min-w-0 flex-col gap-0.5">
        <div class="flex min-w-0 items-center gap-1.5">
          <p
            class="ui:text-foreground min-w-0 flex-1 truncate text-[14px] @3xl:line-clamp-2 @3xl:text-base @3xl:wrap-break-word @3xl:whitespace-normal"
          >
            {path.name}
          </p>
          <div class="@3xl:hidden">
            {@render publishedBadge()}
          </div>
        </div>

        <!-- Mobile Subtitle (type & updated) -->
        <p class="ui:text-muted-foreground text-[11px] @3xl:hidden">
          {#if pathLabel && updatedLabel}
            {pathLabel} · {updatedLabel}
          {:else}
            {pathLabel || updatedLabel}
          {/if}
        </p>

        <!-- Desktop Subtitle (type & updated) -->
        <div class="hidden @3xl:block">
          <p class="ui:text-muted-foreground mt-0.5 text-sm">{pathLabel}</p>
          {#if updatedLabel}
            <p class="ui:text-muted-foreground mt-0.5 text-xs">{updatedLabel}</p>
          {/if}
        </div>
      </div>

      <!-- Column 3: Published Badge (Desktop) -->
      <div class="hidden @3xl:block">
        {@render publishedBadge()}
      </div>

      <!-- Mobile Metrics Row / Desktop Columns 4-5 (@3xl:contents) -->
      <div class="mt-1.5 flex items-center gap-3 text-[11px] @3xl:mt-0 @3xl:contents">
        <!-- Column 4: Courses Count -->
        <div class="flex items-center gap-1.5 text-xs @3xl:text-sm">
          <LearningEntityIcon type="course" size={14} className="size-3 @3xl:size-3.5" />
          <span class="ui:text-foreground font-medium tabular-nums">{courseCount}</span>
          <span class="ui:text-muted-foreground text-xs @3xl:hidden">{$t('learningPath.builder.title')}</span>
        </div>

        <!-- Column 5: Students AvatarStack -->
        <div class="flex items-center">
          {@render studentAvatarStack(false)}
          {@render studentAvatarStack(true)}
        </div>
      </div>
    </div>

    <!-- Column 6: Actions Dropdown Menu -->
    <div class="-mt-0.5 -mr-1 shrink-0 @3xl:mt-0 @3xl:mr-0 @3xl:flex @3xl:justify-end">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon"
              class="ui:text-muted-foreground ui:hover:text-foreground size-7 p-0.5 @3xl:size-8"
              aria-label={$t('learningPath.card.actions_menu_aria')}
              onclick={stopNavigation}
            >
              <EllipsisVerticalIcon class="size-3.5 @3xl:size-4" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <PathContextMenuContent
            id={path.id}
            publicId={path.publicId}
            slug={path.slug}
            name={path.name}
            description={path.description}
            {isPublished}
            openUrl={pathUrl}
            {onDelete}
            includeOpen={true}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{/snippet}

<ResourceListRow.Root
  variant="default"
  size="sm"
  align="start"
  class="cursor-pointer px-3! py-2.5! @3xl:px-4! @3xl:py-3!"
>
  {#snippet child({ props })}
    <a href={pathUrl} {...props} class={cn('block', props.class as string)}>
      {@render rowContent()}
    </a>
  {/snippet}
</ResourceListRow.Root>
