<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { ExerciseQuestion } from '@cio/ui';
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { getExerciseQuestionLabels } from '$features/course/components/exercise/question-labels';
  import QuestionTypeSelect from '$features/course/components/exercise/question-type-select.svelte';
  import { getQuestionTypeOptionById } from '$features/course/components/exercise/question-type-utils';
  import type { ExerciseQuestionModel } from '@cio/question-types';
  import { QUESTION_TYPE_KEY } from '@cio/question-types';
  import { lessonVideoCheckpointStore } from './checkpoint-store.svelte';
  import type { CheckpointResumePolicy, LessonVideoCheckpoint } from './checkpoint-types';
  import {
    cloneCheckpointValue,
    createEmptyCheckpointQuestion,
    findCheckpointCollision,
    formatCheckpointTimestamp,
    isCheckpointQuestionType,
    parseCheckpointTimestamp,
    validateCheckpointQuestion
  } from './checkpoint-utils';

  interface Props {
    open: boolean;
    lessonId: string;
    assetId: string;
    playheadSeconds: number;
    durationSeconds: number;
    checkpoint?: LessonVideoCheckpoint | null;
    onOpenChange: (open: boolean) => void;
  }

  let { open, lessonId, assetId, playheadSeconds, durationSeconds, checkpoint = null, onOpenChange }: Props = $props();

  const autoGradableTypes = QUESTION_TYPES.filter((typeEntry) => typeEntry.autoGradable);
  const questionLabels = $derived(getExerciseQuestionLabels());

  let timestampInput = $state(
    untrack(() => formatCheckpointTimestamp(checkpoint?.timestampSeconds ?? playheadSeconds))
  );
  let resumePolicy = $state<CheckpointResumePolicy>(untrack(() => checkpoint?.resumePolicy ?? 'any'));
  let draftQuestion = $state<ExerciseQuestionModel>(
    untrack(() =>
      checkpoint ? cloneCheckpointValue(checkpoint.question) : createEmptyCheckpointQuestion(QUESTION_TYPE_KEY.RADIO)
    )
  );
  let timestampError = $state('');
  let questionError = $state('');

  const isEditing = $derived(Boolean(checkpoint));
  const selectedTypeId = $derived(
    String(
      QUESTION_TYPES.find((typeEntry) => typeEntry.key === draftQuestion.questionType)?.id ?? autoGradableTypes[0]?.id
    )
  );
  const triggerQuestionType = $derived(getQuestionTypeOptionById(Number(selectedTypeId)));

  function handleTypeChange(value: string) {
    if (!value) return;

    const nextType = getQuestionTypeOptionById(Number(value));
    if (!isCheckpointQuestionType(nextType.key)) return;

    const title = draftQuestion.title;
    const nextQuestion = createEmptyCheckpointQuestion(nextType.key);
    nextQuestion.title = title;
    draftQuestion = nextQuestion;
  }

  function handleSave() {
    timestampError = '';
    questionError = '';

    const timestampSeconds = parseCheckpointTimestamp(timestampInput);
    if (timestampSeconds == null) {
      timestampError = t.get('course.navItem.lessons.materials.tabs.video.checkpoints.errors.timestamp');
      return;
    }

    if (durationSeconds > 0 && timestampSeconds > durationSeconds) {
      timestampError = t.get('course.navItem.lessons.materials.tabs.video.checkpoints.errors.timestamp_range');
      return;
    }

    const siblings = lessonVideoCheckpointStore.listForAsset(lessonId, assetId);
    const collision = findCheckpointCollision(siblings, timestampSeconds, checkpoint?.id);
    if (collision) {
      timestampError = t.get('course.navItem.lessons.materials.tabs.video.checkpoints.errors.collision');
      return;
    }

    const validationKey = validateCheckpointQuestion(draftQuestion);
    if (validationKey) {
      questionError = t.get(`course.navItem.lessons.materials.tabs.video.checkpoints.errors.${validationKey}`);
      return;
    }

    const nextCheckpoint: LessonVideoCheckpoint = {
      id: checkpoint?.id ?? crypto.randomUUID(),
      lessonId,
      assetId,
      timestampSeconds,
      resumePolicy,
      question: cloneCheckpointValue(draftQuestion)
    };

    lessonVideoCheckpointStore.upsert(nextCheckpoint);
    snackbar.success('snackbar.lesson_video.checkpoint_saved');
    onOpenChange(false);
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>
        {isEditing
          ? $t('course.navItem.lessons.materials.tabs.video.checkpoints.edit_title')
          : $t('course.navItem.lessons.materials.tabs.video.checkpoints.add_title')}
      </Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.lessons.materials.tabs.video.checkpoints.editor_description')}
      </Dialog.Description>
    </Dialog.Header>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
      <InputField
        name="checkpoint-time"
        testId="video-checkpoint-time"
        label={$t('course.navItem.lessons.materials.tabs.video.checkpoints.time_label')}
        bind:value={timestampInput}
        errorMessage={timestampError}
      />

      <Field.Field>
        <Field.Label>{$t('course.navItem.lessons.materials.tabs.video.checkpoints.type_label')}</Field.Label>
        <QuestionTypeSelect
          value={selectedTypeId}
          onValueChange={handleTypeChange}
          {triggerQuestionType}
          types={autoGradableTypes}
        />
      </Field.Field>

      <ExerciseQuestion.QuestionRenderer
        showContainer={false}
        contract={{
          mode: 'edit',
          question: draftQuestion,
          labels: questionLabels
        }}
        onQuestionChange={(nextQuestion) => (draftQuestion = nextQuestion)}
      />

      {#if questionError}
        <Field.Error>{questionError}</Field.Error>
      {/if}

      <Field.Set>
        <Field.Legend>{$t('course.navItem.lessons.materials.tabs.video.checkpoints.resume_label')}</Field.Legend>
        <RadioGroup.Root
          value={resumePolicy}
          onValueChange={(value) => {
            if (value === 'any' || value === 'correct') {
              resumePolicy = value;
            }
          }}
        >
          <div class="flex flex-col gap-3">
            <div class="flex items-start gap-2">
              <RadioGroup.Item value="any" id="checkpoint-resume-any" />
              <Label for="checkpoint-resume-any" class="font-normal">
                <span class="block font-medium">
                  {$t('course.navItem.lessons.materials.tabs.video.checkpoints.resume_any')}
                </span>
                <span class="ui:text-muted-foreground mt-0.5 block text-sm">
                  {$t('course.navItem.lessons.materials.tabs.video.checkpoints.resume_any_help')}
                </span>
              </Label>
            </div>
            <div class="flex items-start gap-2">
              <RadioGroup.Item value="correct" id="checkpoint-resume-correct" />
              <Label for="checkpoint-resume-correct" class="font-normal">
                <span class="block font-medium">
                  {$t('course.navItem.lessons.materials.tabs.video.checkpoints.resume_correct')}
                </span>
                <span class="ui:text-muted-foreground mt-0.5 block text-sm">
                  {$t('course.navItem.lessons.materials.tabs.video.checkpoints.resume_correct_help')}
                </span>
              </Label>
            </div>
          </div>
        </RadioGroup.Root>
      </Field.Set>
    </div>

    <Dialog.Footer>
      <Button type="button" variant="outline" onclick={() => onOpenChange(false)}>
        {$t('course.navItem.lessons.materials.tabs.video.checkpoints.cancel')}
      </Button>
      <Button type="button" variant="secondary" testId="video-checkpoint-save" onclick={handleSave}>
        {$t('course.navItem.lessons.materials.tabs.video.checkpoints.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
