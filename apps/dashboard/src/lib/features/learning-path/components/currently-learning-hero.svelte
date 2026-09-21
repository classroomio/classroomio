<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { LearningPathBadge, LearningPathProgress, DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  type PathVariantProps = {
    variant: 'path';
    name: string;
    courseCount: number;
    coursesCompleted: number;
  };

  type CourseVariantProps = {
    variant: 'course';
    title: string;
    partOfPathName?: string | null;
    pathHref?: string;
    lessonsLabel: string;
  };

  type Props = (PathVariantProps | CourseVariantProps) & {
    href: string;
    coverGradient?: string;
    coverImage?: string;
    progressPercent: number;
  };

  let {
    variant,
    href,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    progressPercent,
    ...rest
  }: Props = $props();

  let pathProps: PathVariantProps | null = $derived(variant === 'path' ? (rest as PathVariantProps) : null);
  let courseProps: CourseVariantProps | null = $derived(variant === 'course' ? (rest as CourseVariantProps) : null);

  const heading = $derived.by(() => {
    if (pathProps) return { text: pathProps.name, aria: pathProps.name };
    if (courseProps) return { text: courseProps.title, aria: courseProps.title };

    return { text: '', aria: '' };
  });

  const badgeLabel = $derived.by(() =>
    variant === 'path' ? $t('learningPath.badge.learning_path') : $t('learningPath.badge.course')
  );

  const ctaLabel = $derived.by(() => {
    if (!pathProps) return $t('learningPath.course.continue_course');

    const { coursesCompleted, courseCount } = pathProps;
    if (coursesCompleted === courseCount && courseCount > 0) return $t('learningPath.hero.view_path');
    if (coursesCompleted === 0) return $t('learningPath.hero.start_learning');

    return $t('learningPath.hero.continue_learning');
  });

  const courseCountLabel = $derived.by(() => {
    if (!pathProps) return '';

    return `${pathProps.courseCount} ${
      pathProps.courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')
    }`;
  });
</script>

<div class="flex flex-col overflow-hidden rounded-md border sm:flex-row">
  <!-- Cover — flush to the left edge -->
  <a
    {href}
    class="group ui:bg-card relative flex aspect-[10/8] w-full shrink-0 items-center justify-center overflow-hidden focus-visible:outline-none sm:aspect-auto sm:w-56 md:w-64"
    aria-label={heading.aria}
    tabindex="-1"
  >
    {#if coverImage}
      <img
        src={coverImage}
        alt={heading.aria}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    {:else}
      <img
        src={DEFAULT_COURSE_BANNER_IMAGE}
        alt={heading.aria}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover"
      />
    {/if}
    <LearningPathBadge label={badgeLabel} onCover class="absolute top-3 left-3" />
  </a>

  <!-- Content -->
  <div class="flex min-w-0 flex-1 flex-col gap-5 p-5 md:gap-6">
    <div class="flex min-w-0 flex-1 flex-col py-1">
      <a {href} class="w-fit">
        <h3 class="ui:hover:text-primary text-lg font-semibold tracking-tight">{heading.text}</h3>
      </a>

      {#if pathProps}
        <p class="ui:text-muted-foreground mt-0.5 text-sm">{courseCountLabel}</p>
      {:else if courseProps?.partOfPathName}
        <p class="ui:text-muted-foreground mt-0.5 text-sm">
          <span class="inline-flex items-center gap-1">
            · {$t('learningPath.course.part_of')}:
            <a
              href={courseProps.pathHref ?? '/lms/mylearning'}
              class="ui:text-foreground ui:hover:text-primary font-medium"
            >
              <strong>{courseProps.partOfPathName}</strong>
            </a>
          </span>
        </p>
      {/if}

      <div class="mt-4 flex items-center justify-between gap-3">
        <span class="ui:text-muted-foreground text-sm font-medium">{$t('learningPath.progress.label')}</span>
        <span class="tnum text-sm font-bold">{progressPercent}%</span>
      </div>
      <LearningPathProgress value={progressPercent} class="mt-1.5" />

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
        {#if pathProps}
          <p class="tnum ui:text-muted-foreground min-w-0 flex-1 truncate text-xs">
            {pathProps.coursesCompleted}
            <span class="normal-case">{$t('learningPath.card.of')}</span>
            {pathProps.courseCount}
            {$t('learningPath.hero.courses_completed')}
          </p>
        {:else}
          <p class="tnum ui:text-muted-foreground min-w-0 flex-1 truncate text-xs">{courseProps?.lessonsLabel}</p>
        {/if}
        <Button {href} variant="default" size="default" class="shrink-0">
          {ctaLabel}
          {#if courseProps}
            <ArrowRightIcon class="size-4" />
          {/if}
        </Button>
      </div>
    </div>
  </div>
</div>
