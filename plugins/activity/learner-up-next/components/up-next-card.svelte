<script lang="ts">
  import { Play, ArrowRight, CheckCircle2, BookOpen } from '@lucide/svelte';
  import { isCourseLearnerView, isOrgStudent, isStudentExperience } from '$lib/utils/store/app';

  interface ContentItem {
    id: string;
    title: string;
    type?: string;
    isComplete?: boolean;
    isUnlocked?: boolean;
    sectionTitle?: string;
  }

  interface Props {
    course?: {
      id?: string;
      title?: string;
      [key: string]: any;
    };
    contentData?: {
      grouped?: boolean;
      items?: ContentItem[];
      sections?: Array<{ id: string; title: string; items: ContentItem[] }>;
      [key: string]: any;
    };
    [key: string]: any;
  }

  let { course = {}, contentData }: Props = $props();

  const isLearner = $derived(Boolean($isCourseLearnerView || $isOrgStudent || $isStudentExperience));

  const allNavigableItems = $derived.by(() => {
    if (!contentData) return [];
    if (contentData.grouped && Array.isArray(contentData.sections)) {
      return contentData.sections.flatMap((section) =>
        (section.items || []).map((item) => ({
          ...item,
          sectionTitle: section.title
        }))
      );
    }
    return (contentData.items || []).map((item) => ({ ...item }));
  });

  const validItems = $derived(
    allNavigableItems.filter((item) => item.type === 'lesson' || item.type === 'exercise' || !item.type)
  );

  const completedCount = $derived(validItems.filter((i) => Boolean(i.isComplete)).length);
  const totalCount = $derived(validItems.length);
  const progressPercent = $derived(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

  const upNextItem = $derived(validItems.find((item) => !item.isComplete && (item.isUnlocked ?? true)));

  const isAllComplete = $derived(totalCount > 0 && completedCount === totalCount);

  const nextUrl = $derived.by(() => {
    if (!course?.id || !upNextItem) return null;
    const segment = upNextItem.type === 'exercise' ? 'exercises' : 'lessons';
    return `/courses/${course.id}/${segment}/${upNextItem.id}`;
  });
</script>

{#if isLearner && totalCount > 0}
  {#if upNextItem && nextUrl}
    <div
      class="border-primary/20 from-primary/5 via-card to-card mb-6 overflow-hidden rounded-xl border bg-linear-to-r p-4 shadow-xs sm:p-5"
      data-testid="up-next-resume-card"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0 space-y-1.5">
          <div class="flex items-center gap-2">
            <span
              class="bg-primary/15 text-2xs text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold"
            >
              <Play class="h-2.5 w-2.5 fill-current" />
              Resume Learning
            </span>
            {#if upNextItem.sectionTitle}
              <span class="text-muted-foreground truncate text-xs">
                • {upNextItem.sectionTitle}
              </span>
            {/if}
          </div>

          <h3 class="text-foreground truncate text-base font-semibold">
            {upNextItem.title}
          </h3>

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <div class="bg-muted h-2 w-36 overflow-hidden rounded-full">
              <div
                class="bg-primary h-full rounded-full transition-all duration-300"
                style="width: {progressPercent}%"
              ></div>
            </div>
            <span class="text-muted-foreground text-xs font-medium tabular-nums">
              {completedCount} of {totalCount} completed ({progressPercent}%)
            </span>
          </div>
        </div>

        <div class="shrink-0">
          <a
            href={nextUrl}
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-colors sm:text-sm"
          >
            <span>Continue Lesson</span>
            <ArrowRight class="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  {:else if isAllComplete}
    <div
      class="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 class="h-5 w-5" />
        </div>
        <div>
          <h4 class="text-foreground text-sm font-semibold">All Caught Up!</h4>
          <p class="text-muted-foreground text-xs">
            You've completed all {totalCount} items in this course. Excellent work!
          </p>
        </div>
      </div>
    </div>
  {/if}
{/if}
