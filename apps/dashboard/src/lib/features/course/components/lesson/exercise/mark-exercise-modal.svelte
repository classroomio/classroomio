<script lang="ts">
  import { untrack } from 'svelte';
  import { Badge } from '@cio/ui/base/badge';
  import * as Select from '@cio/ui/base/select';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { STATUS } from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { SubmissionIdData } from '$lib/utils/types/submission';

  import Preview from './preview.svelte';
  import * as Dialog from '@cio/ui/base/dialog';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { Button } from '@cio/ui/base/button';

  // import { useCompletion } from 'ai/svelte';
  // import { QUESTION_TYPE } from '$features/ui/question/constants';

  interface Props {
    open?: boolean;
    onClose?: any;
    handleSave?: any;
    isGradeWithAI?: boolean;
    data: SubmissionIdData;
    deleteSubmission?: any;
    updateStatus?: any;
    isSaving?: boolean;
  }

  let {
    open = $bindable(false),
    onClose = () => {},
    handleSave = (_d: SubmissionIdData) => {},
    isGradeWithAI = $bindable(false),
    data = $bindable(),
    deleteSubmission = async (_id: string, _statusId: number) => {},
    updateStatus = (_arg: { submissionId: string; prevStatusId: number; nextStatusId: number; total: number }) => {},
    isSaving = false
  }: Props = $props();

  const SELECTABLE_STATUS = [
    {
      id: STATUS.SUBMITTED,
      text: $t('course.navItem.submissions.submission_status.submitted')
    },
    {
      id: STATUS.IN_PROGRESS,
      text: $t('course.navItem.submissions.submission_status.in_progress')
    },
    {
      id: STATUS.GRADED,
      text: $t('course.navItem.submissions.submission_status.graded')
    }
  ];

  let status = $state(SELECTABLE_STATUS[0]);
  let reasons = $state({});
  let isLoading = $state(false);
  let openDeletePrompt = $state(false);
  let isDeleting = $state(false);

  const total = calculateTotal(data.questionAnswerByPoint);
  const maxPoints = $derived(getMaxPoints(data.questions));
  const sortedQuestions = $derived(
    Array.isArray(data.questions) ? [...data.questions].sort((a, b) => a.order - b.order) : []
  );

  function getMaxPoints(questions) {
    return (questions || []).reduce((acc, question) => acc + question.points, 0);
  }

  function calculateTotal(grades: Record<string, string>): number {
    if (!grades) return 0;
    return Object.values(grades).reduce((acc, grade) => acc + parseInt(grade || '0'), 0);
  }

  function handleStatusChange(value: string) {
    const newSelectedId = parseInt(value);
    const prevStatusId = data.statusId;

    // Find the new status
    const newStatus = SELECTABLE_STATUS.find((s) => s.id === newSelectedId);

    if (newStatus) {
      // Update state
      status = newStatus;
      data.statusId = newSelectedId;

      updateStatus({
        submissionId: data.id,
        prevStatusId: prevStatusId,
        nextStatusId: newSelectedId,
        total
      });

      snackbar.success(`${$t('snackbar.exercise.submission_updated')} '${newStatus.text}'`);
    }
  }

  function setStatus(data: SubmissionIdData) {
    untrack(() => {
      const statusBySelectedId = SELECTABLE_STATUS.find((s) => s.id === data.statusId);

      if (statusBySelectedId) {
        status = statusBySelectedId;
      }
    });
  }

  // const getMultipleAnswersGrade = (options, answer, points) => {
  //   const correctOptions = options
  //     .filter((option) => option.is_correct)
  //     .map((option) => option.value);

  //   const correctSelections = answer.answers.filter((answer) =>
  //     correctOptions.includes(answer)
  //   ).length;

  //   const incorrectSelections = answer.answers.length - correctSelections;

  //   const pointsEarned = (correctSelections / correctOptions.length) * points;
  //   const deduction = (incorrectSelections * points) / correctOptions.length;
  //   const finalPoints = Math.max(pointsEarned - deduction, 0);

  //   return {
  //     finalPoints,
  //     correctOptions,
  //     correctSelections,
  //     incorrectSelections
  //   };
  // };

  async function handleDeleteSubmission() {
    isDeleting = true;
    await deleteSubmission(data.id, status.id);
    isDeleting = false;
  }

  // const { input, handleSubmit, completion } = useCompletion({
  //   api: '/api/completion/gradingprompt',
  //   onFinish: async () => {
  //     try {
  //       const responseData = $completion.replace('```json', '').replace('```', '');

  //       let aiResponses: {
  //         id: number;
  //         score: number;
  //         explanation: string;
  //       }[] = [];
  //       try {
  //         // Parse the modified response data as JSON
  //         aiResponses = JSON.parse(responseData);
  //       } catch (error) {
  //         console.error('Error parsing AI response', error);
  //       }

  //       data?.questions.forEach((question) => {
  //         const { id, points, question_type_id, options } = question;
  //         if (question_type_id == QUESTION_TYPE.RADIO) {
  //           const answer = data.questionAnswers.find((q) => q.question_id === id);

  //           const answerPoints = answer?.answers?.length ?? 0;

  //           reasons = {
  //             ...reasons,
  //             [id]: `${$t('course.navItem.submissions.grading_modal.allocated')} ${$t(
  //               'course.navItem.submissions.grading_modal.total_try'
  //             )} ${answerPoints} `
  //           };
  //           data.questionAnswerByPoint[id] = `${Math.ceil(points / answerPoints)}`;
  //         } else if (question_type_id == QUESTION_TYPE.CHECKBOX) {
  //           const answer = data.questionAnswers.find((q) => q.question_id === id);

  //           const { finalPoints, correctOptions, correctSelections, incorrectSelections } =
  //             getMultipleAnswersGrade(options, answer, points);

  //           reasons = {
  //             ...reasons,
  //             [id]: `${$t(
  //               'course.navItem.submissions.grading_modal.allocated'
  //             )} ${correctSelections} ${$t('course.navItem.submissions.grading_modal.out_of')} ${
  //               correctOptions.length
  //             } ${$t('course.navItem.submissions.grading_modal.options_correct')} ${$t(
  //               'course.navItem.submissions.grading_modal.options_wrong'
  //             )} ${incorrectSelections} `
  //           };

  //           data.questionAnswerByPoint[id] = `${finalPoints}`;
  //         } else if (aiResponses.length) {
  //           const graded = aiResponses.find((res) => res.id === id);

  //           reasons = {
  //             ...reasons,
  //             [id]: `${graded?.explanation}`
  //           };

  //           data.questionAnswerByPoint[id] = `${graded?.score}`;
  //         }
  //       });
  //     } catch (error) {
  //       console.error('Error', error);
  //     } finally {
  //       isLoading = false;
  //     }
  //   }
  // });

  function gradeWithAI() {
    // isGradeWithAI = true;
    // isLoading = true;
    // const paragraphAiInput = data.questions
    //   .filter((q) => q.question_type_id === QUESTION_TYPE.TEXTAREA)
    //   .map((q) => {
    //     const answer = data.questionAnswers.find((qA) => qA.question_id === q.id); // { open_answer: '' }
    //     return {
    //       id: q.id,
    //       question: q.title,
    //       answer: answer?.open_answer,
    //       point: q.points
    //     };
    //   });
    // $input = JSON.stringify(paragraphAiInput);
    // handleSubmit({ preventDefault: () => {} });
  }

  $effect(() => {
    setStatus(data);
  });
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose();
  }}
>
  <Dialog.Content class="flex h-[85%] h-[90%] !max-h-full w-4/5 items-start px-4 py-0">
    <Dialog.Header class="py-2">
      <Dialog.Title class="text-base font-semibold">{data.title}</Dialog.Title>
    </Dialog.Header>
    <div class="mt-2 h-full w-full">
      {#if openDeletePrompt}
        <div class="mx-auto w-96 rounded-md border border-gray-300 p-3">
          <h1 class="text-lg dark:text-white">
            {$t('delete_modal.content')}
          </h1>

          <div class="mt-5 flex items-center justify-between">
            <Button variant="outline" onclick={() => (openDeletePrompt = false)} disabled={isDeleting}>
              {$t('delete_modal.no')}
            </Button>
            <Button variant="outline" onclick={handleDeleteSubmission} loading={isDeleting}>
              {$t('delete_modal.yes')}
            </Button>
          </div>
        </div>
      {:else}
        <Preview
          questions={sortedQuestions}
          questionnaireMetaData={{
            answers: data.answers || {},
            isFinished: true
          }}
          bind:grades={data.questionAnswerByPoint}
          bind:reasons
          bind:isGradeWithAI
          bind:isLoading
          disableGrading={false}
        />
      {/if}
    </div>
    <div class="sticky top-0 ml-4 mt-2 w-2/5">
      <div class="rounded-md border border-gray-300">
        <div
          class="flex items-center justify-between gap-1 border-b border-l-0 border-r-0 border-t-0 border-gray-300 p-3"
        >
          <p class="text-base dark:text-white">
            {$t('course.navItem.submissions.grading_modal.details')}
            {#if data.isEarly}
              <span class="badge ml-2 rounded-sm bg-green-500 px-2 text-sm text-white">
                {$t('course.navItem.submissions.grading_modal.early')}</span
              >
            {:else}
              <span class="badge ml-2 rounded-sm bg-red-500 px-2 text-sm text-white">
                {$t('course.navItem.submissions.grading_modal.late')}
              </span>
            {/if}
          </p>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
              <EllipsisVerticalIcon class="h-5 w-5" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                class="text-red-600"
                onclick={() => {
                  openDeletePrompt = true;
                }}
              >
                {$t('delete_modal.label')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        <div class="flex items-center space-x-4 px-3 py-2 text-sm">
          <p class="text-sm font-semibold text-gray-500 dark:text-white">
            {$t('course.navItem.submissions.grading_modal.total_grade')}:
          </p>

          <Badge class="w-fit rounded-md bg-gray-100 font-semibold text-black dark:bg-neutral-700 dark:text-white">
            {total}/{maxPoints}
          </Badge>
        </div>
        <!-- <div class="flex items-center text-sm p-3">
        <p class="dark:text-white w-1/2">Status</p>
        <div class="flex items-center">
          <p class="dark:text-white rounded-full w-5 h-5 bg-yellow-300 mr-2" />
          <p class="dark:text-white">Grading</p>
        </div>
      </div> -->
        <div class="flex items-center space-x-4 px-3 py-2 text-sm">
          <p class="text-sm font-semibold text-gray-500 dark:text-white">
            {$t('course.navItem.submissions.grading_modal.student')}:
          </p>
          {#if data.student}
            <div class="flex flex-row items-center justify-center rounded-md bg-gray-100 p-[6px] dark:bg-neutral-700">
              <img alt="Student avatar" class="flex h-5 w-5 rounded-full" src={data.student.avatar_url} />
              <p class="ml-2 line-clamp-1 text-sm font-semibold dark:text-white">
                {data.student.fullname}
              </p>
            </div>
          {/if}
        </div>
        <!-- <div class="flex items-center space-x-4 text-sm px-3 py-2">
        <p class="dark:text-white text-sm text-gray-500 font-semibold">Assesment Type:</p>
        <Tag
          class="dark:text-white font-semibold bg-gray-100 dark:bg-neutral-700 rounded-md text-black w-fit"
          >Paragraph</Tag
        >
      </div> -->

        <div class="flex flex-col items-start px-3 py-2 text-sm">
          <p class="font-semibold text-gray-500 dark:text-white">
            {$t('course.navItem.submissions.grading_modal.status')}:
          </p>
          <Select.Root
            type="single"
            value={status.id.toString()}
            onValueChange={(value) => {
              if (value) {
                handleStatusChange(value);
              }
            }}
          >
            <Select.Trigger class="w-full">
              {status.text}
            </Select.Trigger>
            <Select.Content>
              {#each SELECTABLE_STATUS as statusOption}
                <Select.Item value={statusOption.id.toString()}>
                  {statusOption.text}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="flex flex-col items-start px-3 py-2 text-sm">
          <p class="font-semibold text-gray-500 dark:text-white">
            {$t('course.navItem.submissions.grading_modal.add_comment')}:
          </p>
          <TextareaField
            bgColor="bg-gray-100 dark:bg-neutral-700"
            className="font-semibold"
            placeholder={$t('course.navItem.submissions.grading_modal.add_comment_placeholder')}
            bind:value={data.feedback}
          />
        </div>

        <div class="flex w-full flex-col space-y-3 px-3 py-2">
          <Button variant="outline" onclick={gradeWithAI} class="w-full">
            <img src="/ai.svg" alt="ai" />
            <p class="text-sm font-semibold">
              {$t('course.navItem.submissions.grading_modal.grade_with_ai')}
            </p>
          </Button>
          <Button
            onclick={() => {
              handleSave(data);
              // onClose();
            }}
            loading={isSaving}
            class="w-full"
          >
            {$t('course.navItem.submissions.grading_modal.submit_grades')}
          </Button>
        </div>
        <!-- <div class="flex items-center text-sm p-3">
        <p class="dark:text-white w-1/2">Teacher</p>
        <p class="dark:text-white">rotimi-best</p>
      </div> -->
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  .badge {
    width: fit-content;
  }
</style>
