<script lang="ts">
  import { onDestroy } from 'svelte';
  import FileUpIcon from '@lucide/svelte/icons/file-up';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { MathInput } from '@cio/ui/custom/math-input';
  import { MathTextInput } from '@cio/ui/custom/math-text';
  import { getQuestionMathEditLabels } from '@cio/ui/custom/exercise-question/math-edit-labels';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { courseApi } from '$features/course/api';
  import { getExerciseQuestionLabels } from '$features/course/components/exercise/question-labels';
  import { handleImportQuestions } from '$features/course/components/exercise/store';
  import { mathVisionApi } from '../api/math-vision.svelte';
  import type { WorksheetDraft, WorksheetFileMediaType } from '../utils/types';
  import {
    getDraftAnswer,
    getIncludedQuestions,
    readFileAsBase64,
    toWorksheetDrafts,
    WORKSHEET_FILE_TYPES,
    WORKSHEET_MAX_BYTES,
    withCorrectOption,
    withDraftAnswer,
    withOptionLabel
  } from '../utils/worksheet-utils';

  interface Props {
    open: boolean;
    /** Section that receives the imported questions; defaults to the first one. */
    exerciseSectionId?: string | null;
  }

  let { open = $bindable(false), exerciseSectionId = null }: Props = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let isReading = $state(false);
  let fileError = $state('');
  let previewUrl = $state('');
  let isPdf = $state(false);
  let drafts = $state<WorksheetDraft[]>([]);

  const mathEditLabels = $derived(getQuestionMathEditLabels(getExerciseQuestionLabels()));
  const includedCount = $derived(drafts.filter((draft) => draft.included).length);
  const hasResult = $derived(drafts.length > 0);

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    drafts = [];
    fileError = '';
    isReading = false;
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) reset();
  }

  async function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const courseId = courseApi.course?.id;
    if (!courseId) return;

    if (!WORKSHEET_FILE_TYPES.includes(file.type as WorksheetFileMediaType)) {
      fileError = t.get('math_vision.worksheet.unsupported_file');
      return;
    }
    if (file.size > WORKSHEET_MAX_BYTES) {
      fileError = t.get('math_vision.worksheet.file_too_large');
      return;
    }

    reset();
    previewUrl = URL.createObjectURL(file);
    isPdf = file.type === 'application/pdf';
    isReading = true;

    const data = await readFileAsBase64(file);
    const questions = await mathVisionApi.importWorksheet(courseId, {
      mediaType: file.type as WorksheetFileMediaType,
      data
    });
    isReading = false;

    if (!questions) {
      fileError = mathVisionApi.getFailureMessage();
      return;
    }
    if (questions.length === 0) {
      fileError = t.get('math_vision.worksheet.no_questions');
      return;
    }

    drafts = toWorksheetDrafts(questions);
  }

  function updateDraft(draftId: number, update: (draft: WorksheetDraft) => WorksheetDraft) {
    drafts = drafts.map((draft) => (draft.draftId === draftId ? update(draft) : draft));
  }

  function importSelected() {
    handleImportQuestions(getIncludedQuestions(drafts), exerciseSectionId);
    snackbar.success('math_vision.worksheet.imported');
    handleOpenChange(false);
  }

  onDestroy(reset);
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh]! w-11/12 max-w-6xl! overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('math_vision.worksheet.title')}</Dialog.Title>
      <Dialog.Description>{$t('math_vision.worksheet.description')}</Dialog.Description>
    </Dialog.Header>

    <input
      bind:this={fileInput}
      type="file"
      accept={WORKSHEET_FILE_TYPES.join(',')}
      class="hidden"
      onchange={handleFileChange}
    />

    {#if !previewUrl}
      <div class="flex flex-col items-center gap-3 rounded-md border border-dashed px-6 py-12 text-center">
        <FileUpIcon class="ui:text-muted-foreground size-8" />
        <p class="ui:text-muted-foreground text-sm">{$t('math_vision.worksheet.drop_hint')}</p>
        <Button onclick={() => fileInput?.click()}>{$t('math_vision.worksheet.choose_file')}</Button>
        {#if fileError}
          <p class="ui:text-destructive text-sm" role="alert">{fileError}</p>
        {/if}
      </div>
    {:else}
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <p class="ui:text-muted-foreground text-xs font-medium">{$t('math_vision.worksheet.original')}</p>
          {#if isPdf}
            <iframe
              src={previewUrl}
              title={$t('math_vision.worksheet.original')}
              class="h-[60vh] w-full rounded-md border bg-white"
            ></iframe>
          {:else}
            <img
              src={previewUrl}
              alt={$t('math_vision.worksheet.original')}
              class="max-h-[60vh] w-full rounded-md border bg-white object-contain"
            />
          {/if}
        </div>

        <div class="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <p class="ui:text-muted-foreground text-xs font-medium">{$t('math_vision.worksheet.questions')}</p>

          {#if isReading}
            <p class="ui:text-muted-foreground text-sm" aria-live="polite">{$t('math_vision.worksheet.reading')}</p>
            {#each [0, 1, 2] as placeholder (placeholder)}
              <Skeleton class="h-24 w-full" />
            {/each}
          {:else if fileError}
            <p class="ui:text-destructive text-sm" role="alert">{fileError}</p>
            <Button variant="outline" size="sm" onclick={() => fileInput?.click()}>
              {$t('math_vision.worksheet.choose_another')}
            </Button>
          {/if}

          {#each drafts as draft, draftIndex (draft.draftId)}
            <div class="space-y-3 rounded-md border p-3">
              <div class="flex items-start justify-between gap-2">
                <label class="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={draft.included}
                    onCheckedChange={(checked) =>
                      updateDraft(draft.draftId, (current) => ({ ...current, included: checked === true }))}
                  />
                  {draftIndex + 1}. {$t(`math_vision.worksheet.type.${draft.type}`)}
                </label>
                {#if draft.verified}
                  <Badge variant="success"><CircleCheckIcon />{$t('math_vision.worksheet.verified')}</Badge>
                {:else}
                  <Badge variant="warning"><TriangleAlertIcon />{$t('math_vision.worksheet.unverified')}</Badge>
                {/if}
              </div>

              <MathTextInput
                value={draft.title}
                labels={mathEditLabels}
                ariaLabel={$t('math_vision.worksheet.question_label')}
                onValueChange={(title) => updateDraft(draft.draftId, (current) => ({ ...current, title }))}
              />

              {#if draft.type === 'RADIO'}
                <RadioGroup.Root
                  value={String(draft.options.findIndex((option) => option.isCorrect))}
                  onValueChange={(value) =>
                    updateDraft(draft.draftId, (current) => withCorrectOption(current, Number(value)))}
                  class="space-y-2"
                >
                  {#each draft.options as option, optionIndex (optionIndex)}
                    <div class="flex items-center gap-2">
                      <RadioGroup.Item
                        value={String(optionIndex)}
                        aria-label={$t('math_vision.worksheet.correct_option')}
                      />
                      <MathTextInput
                        class="flex-1"
                        value={option.label}
                        labels={mathEditLabels}
                        ariaLabel={$t('math_vision.worksheet.option_label')}
                        onValueChange={(label) =>
                          updateDraft(draft.draftId, (current) => withOptionLabel(current, optionIndex, label))}
                      />
                    </div>
                  {/each}
                </RadioGroup.Root>
              {:else}
                <div class="space-y-1">
                  <p class="ui:text-muted-foreground text-xs">{$t('math_vision.worksheet.answer_label')}</p>
                  <MathInput
                    value={getDraftAnswer(draft)}
                    keyboard="full"
                    ariaLabel={$t('math_vision.worksheet.answer_label')}
                    onInput={({ latex }) => updateDraft(draft.draftId, (current) => withDraftAnswer(current, latex))}
                  />
                </div>
              {/if}

              {#if !draft.verified}
                <ul class="ui:text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                  {#each draft.issues as issue (issue)}
                    <li>{issue}</li>
                  {/each}
                </ul>
                <p class="ui:text-muted-foreground text-xs">{$t('math_vision.worksheet.unverified_hint')}</p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="outline" size="sm" onclick={() => handleOpenChange(false)}
        >{$t('math_vision.worksheet.cancel')}</Button
      >
      <Button size="sm" disabled={!hasResult || includedCount === 0} onclick={importSelected}>
        {$t('math_vision.worksheet.import_selected', { count: includedCount })}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
