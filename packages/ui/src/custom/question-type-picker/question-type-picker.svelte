<script lang="ts">
  import type { AnswerData, ExerciseQuestionModel } from '@cio/question-types';
  import { QUESTION_TYPE_KEY, type QuestionTypeKey } from '@cio/question-types';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { QuestionRenderer } from '../exercise-question';
  import { QUESTION_TYPE_PICKER_EXERCISE_LABELS } from './exercise-labels';
  import { QUESTION_TYPE_PICKER_ITEMS, getQuestionTypePickerItem } from './picker-data';
  import QuestionTypeIcon from './question-type-icon.svelte';
  import { cn } from '../../tools';

  let selectedKey = $state<QuestionTypeKey>(QUESTION_TYPE_PICKER_ITEMS[0]!.key);
  let answer = $state<AnswerData | null>(null);

  const currentItem = $derived(getQuestionTypePickerItem(selectedKey));
  const previewHeading = $derived(currentItem?.displayLabel ?? '');
  const previewDescription = $derived(currentItem?.description ?? '');
  const activeQuestion = $derived(
    currentItem?.demoQuestion ?? {
      id: 'picker-fallback',
      key: 'picker-fallback',
      title: '',
      questionType: 'SHORT_ANSWER',
      settings: {}
    }
  );

  function selectItem(key: QuestionTypeKey) {
    selectedKey = key;
    answer = null;
  }

  async function demoFileUpload(file: File) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 350);
    });

    return {
      fileKey: `demo/${file.name}`,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file)
    };
  }

  async function demoVideoRecordingUpload(input: {
    blob: Blob;
    fileName: string;
    mimeType: string;
    size: number;
    durationSeconds: number;
    recordedAt: string;
    retakeCount: number;
  }) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 350);
    });

    return {
      type: 'VIDEO_RECORDING' as const,
      assetId: '00000000-0000-4000-8000-000000000001',
      storageKey: `demo/${input.fileName}`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      durationSeconds: input.durationSeconds,
      recordedAt: input.recordedAt,
      uploadedAt: new Date().toISOString(),
      provider: 'cloudflare' as const,
      retakeCount: input.retakeCount
    };
  }
</script>

<div
  class={cn(
    'ui:box-border ui:flex ui:min-h-[320px] ui:w-full ui:max-w-full ui:min-w-0 ui:flex-col ui:overflow-hidden ui:rounded-xl ui:border ui:border-border ui:bg-background ui:text-foreground ui:md:flex-row'
  )}
>
  <nav
    class="ui:flex ui:w-full ui:shrink-0 ui:flex-row ui:gap-0 ui:overflow-x-auto ui:overflow-y-hidden ui:border-b ui:border-border ui:bg-background ui:p-0 ui:md:w-52 ui:md:flex-col ui:md:overflow-x-visible ui:md:overflow-y-visible ui:md:border-b-0 ui:md:border-r"
    aria-label="Question types"
  >
    {#each QUESTION_TYPE_PICKER_ITEMS as item (item.key)}
      {@const isActive = item.key === selectedKey}

      <button
        type="button"
        class={cn(
          'ui:flex ui:shrink-0 ui:cursor-pointer ui:items-center ui:gap-2.5 ui:rounded-none ui:px-3 ui:py-2 ui:text-left ui:text-sm ui:transition-colors ui:border-l-4 ui:border-solid ui:md:w-full',
          isActive
            ? 'ui:border-l-foreground ui:bg-secondary ui:text-secondary-foreground'
            : 'ui:border-l-transparent ui:bg-transparent ui:text-foreground',
          !isActive && 'ui:hover:bg-muted/40'
        )}
        aria-current={isActive ? 'true' : undefined}
        onclick={() => selectItem(item.key)}
      >
        <QuestionTypeIcon key={item.key} class="ui:size-8" />
        <span class="ui:leading-tight">{item.displayLabel}</span>
      </button>
    {/each}
  </nav>

  <div class="ui:flex ui:min-h-0 ui:min-w-0 ui:flex-1 ui:flex-col ui:bg-background ui:p-4 ui:sm:p-6">
    <p class="ui:text-xs ui:font-semibold ui:tracking-wide ui:text-muted-foreground">
      {previewHeading.toUpperCase()}
    </p>
    <p class="ui:mt-1 ui:text-sm ui:text-muted-foreground">
      {previewDescription}
    </p>

    <div class="ui:mt-4 ui:grid ui:min-h-0 ui:flex-1 ui:overflow-hidden" style="grid-template-areas: 'slot';">
      {#key selectedKey}
        <div class="ui:min-w-0 [grid-area:slot]" in:fly={{ y: 14, duration: 400, opacity: 0, easing: cubicOut }}>
          <QuestionRenderer
            showContainer={false}
            contract={{
              mode: 'take',
              question: activeQuestion as ExerciseQuestionModel,
              answer,
              labels: QUESTION_TYPE_PICKER_EXERCISE_LABELS,
              onFileUpload: demoFileUpload,
              onVideoRecordingUpload: demoVideoRecordingUpload
            }}
            onAnswerChange={(nextAnswer) => {
              answer = nextAnswer;
            }}
          />
        </div>
      {/key}
    </div>
  </div>
</div>
