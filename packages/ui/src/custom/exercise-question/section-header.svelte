<script lang="ts">
  import Separator from '$src/base/separator/separator.svelte';
  import type { ExerciseSectionColorTheme } from '@cio/question-types';

  const COLOR_CLASSES: Record<ExerciseSectionColorTheme, string> = {
    blue: 'ui:bg-blue-600!',
    green: 'ui:bg-emerald-500!',
    amber: 'ui:bg-amber-500!',
    rose: 'ui:bg-rose-500!',
    violet: 'ui:bg-violet-500!',
    slate: 'ui:bg-slate-500!'
  };

  interface Props {
    title: string;
    description?: string | null;
    sectionNumber: number;
    totalSections: number;
    colorTheme?: ExerciseSectionColorTheme;
    questionCount?: number;
    totalPoints?: number;
    labels?: {
      section?: string;
      questions?: string;
      points?: string;
    };
  }

  let {
    title,
    description = null,
    sectionNumber,
    totalSections: _totalSections,
    colorTheme = 'blue',
    questionCount,
    totalPoints,
    labels = {}
  }: Props = $props();

  const sectionMetaSummary = $derived.by(() => {
    const segments: string[] = [];
    if (questionCount !== undefined) {
      segments.push(`${questionCount} ${labels.questions ?? 'questions'}`);
    }
    if (totalPoints !== undefined) {
      segments.push(`${totalPoints} ${labels.points ?? 'points'}`);
    }
    return segments.join(' · ');
  });
</script>

<header>
  <div class="ui:flex ui:items-center ui:gap-2">
    <span class={`ui:h-2 ui:w-2 ui:rounded-full ui:inline-block ${COLOR_CLASSES[colorTheme]}`}> </span>

    <p class="ui:text-sm ui:font-medium ui:uppercase">
      {title}
    </p>
    {#if questionCount !== undefined || totalPoints !== undefined}
      <p class="ui:text-xs ui:text-muted-foreground">({sectionMetaSummary})</p>
    {/if}

    <Separator orientation="horizontal" class="ui:flex-1 ui:h-0.5! {COLOR_CLASSES[colorTheme]}" />
  </div>

  <p class="ui:text-sm ui:text-muted-foreground">
    {description}
  </p>
</header>
