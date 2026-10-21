<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import * as Sheet from '@cio/ui/base/sheet';
  import { ExerciseQuestion } from '@cio/ui';
  import { InputField } from '@cio/ui/custom/input-field';
  import type { ExerciseQuestionModel } from '@cio/question-types';
  import { QUESTION_TYPE_KEY } from '@cio/question-types';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { videoCheckpointApi } from '$features/course/api';
  import type { VideoCheckpoint } from '$features/course/utils/types';
  import { getExerciseQuestionLabels } from '$features/course/components/exercise/question-labels';
  import QuestionTypeSelect from '$features/course/components/exercise/question-type-select.svelte';
  import { getQuestionTypeOptionById } from '$features/course/components/exercise/question-type-utils';
  import type { CheckpointResumePolicy } from './checkpoint-types';
  import {
    cloneCheckpointValue,
    createEmptyCheckpointQuestion,
    findCheckpointCollision,
    formatCheckpointTimestamp,
    isCheckpointQuestionType,
    parseCheckpointTimestamp,
    toCheckpointRequestBody,
    validateCheckpointQuestion
  } from './checkpoint-utils';

  interface Props {
    courseId: string;
    lessonId: string;
    assetId: string;
    playheadSeconds: number;
    durationSeconds: number;
    checkpoint?: VideoCheckpoint | null;
    onClose: () => void;
  }

  let { courseId, lessonId, assetId, playheadSeconds, durationSeconds, checkpoint = null, onClose }: Props = $props();

  const T = 'course.navItem.lessons.materials.tabs.video.checkpoints';
  const autoGradableTypes = QUESTION_TYPES.filter((typeEntry) => typeEntry.autoGradable);
  const questionLabels = $derived(getExerciseQuestionLabels());

  const isEditing = untrack(() => checkpoint !== null);

  let timestampInput = $state(
    untrack(() => formatCheckpointTimestamp(checkpoint?.timestampSeconds ?? playheadSeconds))
  );
  let resumePolicy = $state<CheckpointResumePolicy>(
    untrack(() => (checkpoint?.resumePolicy === 'correct' ? 'correct' : 'any'))
  );
  let draftQuestion = $state<ExerciseQuestionModel>(
    untrack(() =>
      checkpoint ? cloneCheckpointValue(checkpoint.question) : createEmptyCheckpointQuestion(QUESTION_TYPE_KEY.RADIO)
    )
  );
  let timestampError = $state('');
  let questionError = $state('');

  const selectedTypeId = $derived(
    String(
      QUESTION_TYPES.find((typeEntry) => typeEntry.key === draftQuestion.questionType)?.id ?? autoGradableTypes[0]?.id
    )
  );
  const triggerQuestionType = $derived(getQuestionTypeOptionById(Number(selectedTypeId)));

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    onClose();
  }

  function handleTypeChange(value: string) {
    if (!value) return;

    const nextType = getQuestionTypeOptionById(Number(value));
    if (!isCheckpointQuestionType(nextType.key)) return;

    const title = draftQuestion.title;
    const nextQuestion = createEmptyCheckpointQuestion(nextType.key);
    nextQuestion.title = title;
    draftQuestion = nextQuestion;
    questionError = '';
  }

  async function handleSave() {
    timestampError = '';
    questionError = '';

    const timestampSeconds = parseCheckpointTimestamp(timestampInput);
    if (timestampSeconds == null) {
      timestampError = t.get(`${T}.errors.timestamp`);
      return;
    }

    if (durationSeconds > 0 && timestampSeconds >= durationSeconds) {
      timestampError = t.get(`${T}.errors.timestamp_range`);
      return;
    }

    const siblings = videoCheckpointApi.forAsset(assetId);
    if (findCheckpointCollision(siblings, timestampSeconds, checkpoint?.id)) {
      timestampError = t.get(`${T}.errors.collision`);
      return;
    }

    const validationKey = validateCheckpointQuestion(draftQuestion);
    if (validationKey) {
      questionError = t.get(`${T}.errors.${validationKey}`);
      return;
    }

    const body = toCheckpointRequestBody({ timestampSeconds, resumePolicy, question: draftQuestion });
    const saved = checkpoint
      ? await videoCheckpointApi.update(courseId, lessonId, checkpoint.id, body)
      : await videoCheckpointApi.create(courseId, lessonId, { ...body, assetId });
    if (!saved) return;

    snackbar.success('snackbar.lesson_video.checkpoint_saved');
    onClose();
  }
</script>

<Sheet.Root open={true} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-2xl" data-testid="video-checkpoint-editor-sheet">
    <Sheet.Header>
      <Sheet.Title>{isEditing ? $t(`${T}.edit_title`) : $t(`${T}.add_title`)}</Sheet.Title>
      <Sheet.Description>{$t(`${T}.editor_description`)}</Sheet.Description>
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
      <Field.Group>
        <Field.Set>
          <Field.Legend>{$t(`${T}.sections.when`)}</Field.Legend>

          <Field.Group>
            <InputField
              name="checkpoint-time"
              testId="video-checkpoint-time"
              label={$t(`${T}.time_label`)}
              bind:value={timestampInput}
              errorMessage={timestampError}
              onInput={() => (timestampError = '')}
            />
          </Field.Group>
        </Field.Set>

        <Field.Separator />

        <Field.Set>
          <Field.Legend>{$t(`${T}.sections.question`)}</Field.Legend>

          <Field.Group>
            <Field.Field>
              <Field.Label>{$t(`${T}.type_label`)}</Field.Label>
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
              onQuestionChange={(nextQuestion) => {
                draftQuestion = nextQuestion;
                questionError = '';
              }}
            />

            {#if questionError}
              <Field.Error>{questionError}</Field.Error>
            {/if}
          </Field.Group>
        </Field.Set>

        <Field.Separator />

        <Field.Set>
          <Field.Legend>{$t(`${T}.resume_label`)}</Field.Legend>

          <RadioGroup.Root bind:value={resumePolicy} class="space-y-3">
            <div class="flex items-start gap-2">
              <RadioGroup.Item value="any" id="checkpoint-resume-any" />
              <Label for="checkpoint-resume-any" class="font-normal">
                <span class="block font-medium">{$t(`${T}.resume_any`)}</span>
                <span class="ui:text-muted-foreground mt-0.5 block text-sm">{$t(`${T}.resume_any_help`)}</span>
              </Label>
            </div>
            <div class="flex items-start gap-2">
              <RadioGroup.Item value="correct" id="checkpoint-resume-correct" />
              <Label for="checkpoint-resume-correct" class="font-normal">
                <span class="block font-medium">{$t(`${T}.resume_correct`)}</span>
                <span class="ui:text-muted-foreground mt-0.5 block text-sm">{$t(`${T}.resume_correct_help`)}</span>
              </Label>
            </div>
          </RadioGroup.Root>
        </Field.Set>
      </Field.Group>
    </div>

    <Sheet.Footer>
      <div class="flex justify-end gap-2">
        <Button variant="outline" size="sm" onclick={() => handleOpenChange(false)}>{$t(`${T}.cancel`)}</Button>
        <Button size="sm" onclick={handleSave} loading={videoCheckpointApi.isSaving} testId="video-checkpoint-save">
          {$t(`${T}.save`)}
        </Button>
      </div>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
