<script lang="ts">
  import { Button } from '../../base/button';
  import type { ExerciseSectionColorTheme } from '@cio/question-types';

  const ACCENT_CLASSES: Record<ExerciseSectionColorTheme, string> = {
    blue: 'ui:bg-blue-600',
    green: 'ui:bg-emerald-500',
    amber: 'ui:bg-amber-500',
    rose: 'ui:bg-rose-500',
    violet: 'ui:bg-violet-500',
    slate: 'ui:bg-slate-500'
  };

  interface Props {
    sectionTitle: string;
    sectionDescription?: string | null;
    sectionNumber: number;
    totalSections: number;
    questionCount: number;
    totalPoints: number;
    colorTheme?: ExerciseSectionColorTheme;
    onBegin: () => void;
    onBack: () => void;
    labels: {
      beginSection: string;
      back: string;
      questions: string;
      points: string;
      section: string;
    };
  }

  let {
    sectionTitle,
    sectionDescription = null,
    sectionNumber,
    totalSections,
    questionCount,
    colorTheme = 'blue',
    onBegin,
    onBack,
    labels
  }: Props = $props();

  const segmentIndexes = $derived(Array.from({ length: totalSections }, (_, index) => index));
</script>

<section
  class="ui:mx-auto ui:flex ui:min-h-[32rem] ui:w-full ui:max-w-5xl ui:flex-col ui:bg-background ui:px-3 ui:py-6"
>
  <div class="ui:mb-16 ui:flex ui:items-center ui:gap-5">
    <div class="ui:flex ui:flex-1 ui:gap-2">
      {#each segmentIndexes as segmentIndex}
        <span
          class={`ui:h-1 ui:flex-1 ui:rounded-full ${segmentIndex < sectionNumber ? 'ui:bg-muted-foreground/30' : 'ui:bg-muted'}`}
          aria-hidden="true"
        ></span>
      {/each}
    </div>
    <p class="ui:shrink-0 ui:text-sm ui:text-muted-foreground">
      {labels.section}
      {sectionNumber} of {totalSections}
    </p>
  </div>

  <div class="ui:flex ui:flex-1 ui:flex-col">
    <p class="ui:text-sm ui:font-semibold ui:uppercase ui:tracking-[0.18em] ui:text-muted-foreground">
      {labels.section}
      {sectionNumber} of {totalSections}
    </p>
    <span class={`ui:mt-8 ui:h-1 ui:w-14 ui:rounded-full ${ACCENT_CLASSES[colorTheme]}`}></span>

    <h2 class="ui:mt-10 ui:font-serif ui:text-5xl ui:font-bold ui:tracking-tight ui:text-foreground ui:md:text-6xl">
      {sectionTitle}
    </h2>

    <div class="ui:mt-9 ui:flex ui:items-center ui:gap-3 ui:text-lg ui:text-muted-foreground">
      <span class={`ui:h-2.5 ui:w-2.5 ui:rounded-full ${ACCENT_CLASSES[colorTheme]}`} aria-hidden="true"></span>
      <span>{questionCount} {labels.questions}</span>
    </div>

    {#if sectionDescription}
      <p class="ui:mt-8 ui:max-w-3xl ui:text-xl ui:leading-8 ui:text-muted-foreground">{sectionDescription}</p>
    {/if}

    <div class="ui:mt-auto ui:border-t ui:pt-8">
      <div class="ui:flex ui:items-center ui:justify-between ui:gap-4">
        <Button type="button" variant="outline" onclick={onBack}>{labels.back}</Button>
        <Button type="button" onclick={onBegin} size="lg">{labels.beginSection}</Button>
      </div>
    </div>
  </div>
</section>
