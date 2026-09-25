<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { GitBranch } from '@lucide/svelte';

  interface ExploreCourse {
    id?: string;
    title: string;
    metaLabel: string;
    coverGradient?: string;
    coverImage?: string;
    partOfPathName?: string | null;
  }

  interface Props {
    items: ExploreCourse[];
  }

  let { items }: Props = $props();
</script>

<section class="mt-9 mb-10">
  <div class="mb-1 flex items-center justify-between gap-3">
    <h2 class="text-base font-semibold">{$t('learningPath.course.explore_more_title')}</h2>
    <a
      class="ui:text-muted-foreground ui:hover:text-primary inline-flex items-center gap-1 text-sm hover:underline"
      href="/lms/explore"
    >
      {$t('learningPath.course.view_more')}
      <ArrowRightIcon class="size-3.5" />
    </a>
  </div>
  <p class="ui:text-muted-foreground -mt-1 mb-4 text-sm">{$t('learningPath.course.explore_more_tagline')}</p>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    {#each items as course (course.id ?? course.title)}
      <div
        class="group ui:hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-[box-shadow,border-color] hover:shadow-md"
      >
        <div
          class="relative flex h-20 items-center justify-center overflow-hidden"
          style="background: {course.coverGradient ??
            'linear-gradient(135deg, oklch(0.645 0.246 16.439), oklch(0.586 0.253 17.585))'}"
        >
          {#if course.coverImage}
            <img
              src={course.coverImage}
              alt={course.title}
              loading="lazy"
              class="absolute inset-0 h-full w-full object-cover"
            />
          {/if}
          <LearningPathBadge type="course" onCover class="absolute top-3 left-3" />
        </div>
        <div class="flex flex-1 flex-col p-4">
          <h3 class="line-clamp-1 text-sm font-semibold">{course.title}</h3>
          <span class="ui:text-muted-foreground mt-1 text-xs">{course.metaLabel}</span>
          {#if course.partOfPathName}
            <span class="ui:text-muted-foreground mt-1.5 inline-flex items-center gap-1.5 text-xs">
              <GitBranch class="size-3.5 shrink-0" />
              {$t('learningPath.course.part_of')}:
              <strong>{course.partOfPathName}</strong>
            </span>
          {/if}
          <div class="mt-3 flex flex-1 items-end">
            <Button href="/lms/explore" variant="outline" size="sm" class="w-full">
              {$t('learningPath.course.view_course')}
            </Button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>
