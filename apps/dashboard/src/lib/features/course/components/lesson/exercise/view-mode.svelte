<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { group, course } from '$features/course/store';
  import { questionnaire } from '../store/exercise';
  import { questionnaireMetaData } from '../store/answers';
  import Preview from './preview.svelte';
  import { RadioQuestion } from '$features/ui/question';
  import { CheckboxQuestion } from '$features/ui/question/CheckboxQuestion/index.svelte';
  import { TextareaQuestion } from '$features/ui/question/TextareaQuestion/index.svelte';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import { Empty } from '@cio/ui/custom/empty';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';
  import { Progress } from '@cio/ui/base/progress';
  import { removeDuplicate } from '$lib/utils/functions/removeDuplicate';
  import { QUESTION_TYPE } from '$features/ui/question/constants';
  import { STATUS } from './constants';
  import { getPropsForQuestion, filterOutDeleted, wasCorrectAnswerSelected } from './functions';
  import { formatAnswers, getGroupMemberId } from '$features/course/utils/functions';
  import { submitExercise } from '$lib/utils/services/courses';
  import { fetchSubmission } from '$lib/utils/services/submissions';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { NOTIFICATION_NAME, triggerSendEmail } from '$lib/utils/services/notification/notification';
  import { lesson } from '../store/lessons';
  import { COURSE_TYPE } from '$lib/utils/types';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    preview?: boolean;
    exerciseId?: string;
    isFetchingExercise?: boolean;
  }

  let { preview = false, exerciseId = '', isFetchingExercise = false }: Props = $props();

  let submission;
  let hasSubmission = false;
  let isLoadingAutoSavedData = $state(false);
  let alreadyCheckedAutoSavedData = $state(false);
  let submissionResponse;

  function handleStart() {
    $questionnaireMetaData.currentQuestionIndex += 1;
  }

  const getStudent = (people, profileId) => {
    return people.find((person) => person.profile_id === profileId);
  };

  const notifyEducator = () => {
    const student = getStudent($group.students, $profile.id);
    const teacherFullname = $group.tutors[0]?.fullname;
    const teacherEmail = $group.tutors[0]?.email;
    console.log({
      student,
      teacherFullname,
      teacherEmail
    });
    if (!student || !teacherFullname || !teacherEmail) return;

    const baseUrl = `${window.location.origin}/courses/${$course.id}`;
    const exerciseLink = `${baseUrl}/lessons/${$lesson.id}/exercises/${exerciseId}`;
    const submissionLink = `${baseUrl}/submissions`;
    const content = `
      <p>Hello ${teacherFullname},</p>
      <p>A student ${student.profile.fullname} just submitted an exercise <a href=${exerciseLink}>${$questionnaire.title}</a>
        <p>You can get started grading by clicking "Open Submissions"</p>
      <div>
        <a class="button" href=${submissionLink}>Open Submissions</a>
      </div>
      `;

    triggerSendEmail(NOTIFICATION_NAME.EXERCISE_SUBMISSION_UPDATE, {
      to: teacherEmail,
      content,
      orgName: $currentOrg?.name,
      exerciseTitle: $questionnaire.title
    });
  };

  async function onSubmit(id, value) {
    const { answers } = $questionnaireMetaData;
    const { questions } = $questionnaire;
    const prevAnswer = answers[id] || [];

    const formattedAnswer = typeof value === 'string' ? value : removeDuplicate([...prevAnswer, ...(value || [])]);

    $questionnaireMetaData.answers = {
      ...answers,
      [id]: formattedAnswer
    };

    const isCorrect = wasCorrectAnswerSelected(currentQuestion, $questionnaireMetaData.answers);
    console.log({ isCorrect });

    const isFinished = !questions[$questionnaireMetaData.currentQuestionIndex];
    console.log(`isFinished`, isFinished);
    console.log(`$questionnaireMetaData.currentQuestionIndex`, $questionnaireMetaData.currentQuestionIndex);

    if (isCorrect) {
      setTimeout(async () => {
        $questionnaireMetaData.currentQuestionIndex += 1;
        localStorage.setItem(`autosave-exercise-${exerciseId}`, JSON.stringify($questionnaireMetaData));

        // If last question send to server
        if (isFinished) {
          localStorage.removeItem(`autosave-exercise-${exerciseId}`);
          $questionnaireMetaData.status = 1;
          $questionnaireMetaData.totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);
          $questionnaireMetaData.grades = {};

          $questionnaireMetaData.comment = '';
          let response = await submitExercise(
            $questionnaireMetaData.answers,
            questions,
            exerciseId,
            $course.id,
            getGroupMemberId($group.people, $profile.id)
          );

          if (response) {
            submissionResponse = response;
          }

          notifyEducator();
        }
      }, 1000);
    }

    // if (moveToNextQuestion) {
    //   $questionnaireMetaData.currentQuestionIndex += 1;
    //   localStorage.setItem(
    //     `autosave-exercise-${exerciseId}`,
    //     JSON.stringify($questionnaireMetaData)
    //   );
    // }
  }

  function onPrevious() {
    $questionnaireMetaData.currentQuestionIndex -= 1;
  }

  function getProgressValue(currentQuestionIndex) {
    if ($questionnaireMetaData.isFinished) {
      return 100;
    }

    return Math.round(((currentQuestionIndex - 1) / $questionnaire.questions.length) * 100) || 0;
  }

  function getTotalPossibleGrade(questions) {
    return questions.reduce((acc, question) => {
      acc += parseFloat(question.points);
      return acc;
    }, 0);
  }

  async function checkForSubmission(people, profileId?: string, courseId?: string) {
    if (!Array.isArray(people) || !profileId || !courseId || !!submission) {
      return;
    }

    if (hasSubmission) return;

    hasSubmission = true;

    const args = {
      exerciseId,
      courseId,
      submittedBy: getGroupMemberId(people, profileId)
    };
    const { data } = await fetchSubmission(args);

    if (Array.isArray(data) && data.length) {
      submission = data[0];

      $questionnaireMetaData.answers = formatAnswers({
        questions: $questionnaire.questions,
        answers: submission.answers
      });

      $questionnaireMetaData.totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);

      $questionnaireMetaData.currentQuestionIndex = $questionnaire.questions.length;
      $questionnaireMetaData.isFinished = true;
      $questionnaireMetaData.status = submission.status_id;
      $questionnaireMetaData.finalTotalGrade = 0;
      $questionnaireMetaData.comment = submission.feedback;
      $questionnaireMetaData.grades = submission.answers.reduce((acc, answer) => {
        acc[answer.question_id] = answer.point;
        $questionnaireMetaData.finalTotalGrade += answer.point;

        return acc;
      }, {});
    }
  }

  function getAutoSavedData() {
    isLoadingAutoSavedData = true;

    const stringifiedQuestionnaireMetaData = localStorage.getItem(`autosave-exercise-${exerciseId}`);

    if (stringifiedQuestionnaireMetaData) {
      const autoSavedData = JSON.parse(stringifiedQuestionnaireMetaData);
      if (autoSavedData) {
        $questionnaireMetaData = autoSavedData;
      }
    }
    isLoadingAutoSavedData = false;
    alreadyCheckedAutoSavedData = true;
  }

  $effect(() => {
    if (!alreadyCheckedAutoSavedData) {
      getAutoSavedData();
    }
  });

  const progressValue = $derived(getProgressValue($questionnaireMetaData.currentQuestionIndex));
  const currentQuestion = $derived($questionnaire.questions[$questionnaireMetaData.currentQuestionIndex - 1]);
  const isExerciseLoaded = $derived(alreadyCheckedAutoSavedData && $questionnaire.questions.length > 0);
  const isFinished = $derived(isExerciseLoaded && $questionnaireMetaData.currentQuestionIndex > 0 && !currentQuestion);
  const renderProps = $derived(
    getPropsForQuestion(
      $questionnaire.questions,
      currentQuestion,
      $questionnaireMetaData,
      $questionnaireMetaData.currentQuestionIndex,
      onSubmit,
      onPrevious,
      preview
    )
  );

  $effect(() => {
    untrack(() => {
      $questionnaireMetaData.isFinished = isFinished;
    });
  });

  $effect(() => {
    untrack(() => {
      $questionnaireMetaData.progressValue = progressValue;
    });
  });

  $effect(() => {
    !isFetchingExercise && checkForSubmission($group.people, $profile.id, $course.id);
  });
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished}
  <Progress value={$questionnaireMetaData.progressValue} />
{/if}

{#if preview}
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <Preview questions={filterOutDeleted($questionnaire.questions)} questionnaireMetaData={$questionnaireMetaData} />
  </RoleBasedSecurity>
{:else if !$questionnaire.questions.length}
  <Empty
    title="No question added for this exercise"
    description="Click the Edit button to add."
    icon={FileQuestionIcon}
    variant="page"
  >
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <p class="ui:text-primary text-center text-sm">
        Click the <span class="font-semibold">Edit</span> button to add.
      </p>
    </RoleBasedSecurity>
  </Empty>
{:else if $questionnaireMetaData.currentQuestionIndex === 0}
  <RoleBasedSecurity allowedRoles={[3]}>
    <div>
      <h2 class="my-1">{$questionnaire.title}</h2>

      <div class="flex items-center">
        <p class="mx-2 dark:text-white">
          <strong>{$questionnaire.questions.length}</strong> questions
        </p>
        |
        <p class="mx-2 dark:text-white">
          <strong>{getTotalPossibleGrade($questionnaire.questions)}</strong> points.
        </p>
        |
        <p class="mx-2 dark:text-white">All required</p>
        {#if $questionnaire.due_by}
          |
          <p class="mx-2 dark:text-white">
            <strong>Due by:</strong>
            {new Date($questionnaire.due_by).toLocaleString()}
          </p>
        {/if}
      </div>

      <article class="preview prose prose-sm sm:prose mt-3 p-2">
        {@html sanitizeHtml($questionnaire.description || 'No desription')}
      </article>

      <Button onclick={handleStart} type="button" class="float-right my-5">Start</Button>
    </div>
  </RoleBasedSecurity>
{:else if $questionnaireMetaData.isFinished}
  {#if !isLoadingAutoSavedData}
    <div class="flex items-center justify-between">
      <div class="flex w-full flex-col items-start lg:flex-row lg:items-center lg:space-x-4">
        <h2 class="text-xl font-normal">{$questionnaire.title}</h2>

        {#if STATUS.GRADED === $questionnaireMetaData.status}
          <span
            class="status-text bg-green-700 px-2 py-1 text-center text-white"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.graded')}
          </span>
        {:else if $course.type === COURSE_TYPE.SELF_PACED}
          <span
            class="status-text bg-green-700 px-2 py-1 text-center text-white"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_submitted')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.submitted')}
          </span>
        {:else}
          <span
            class="status-text bg-yellow-600 px-2 py-1 text-center text-white"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_pending')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.pending')}
          </span>
        {/if}
      </div>
      {#if STATUS.GRADED === $questionnaireMetaData.status && $course.type !== COURSE_TYPE.SELF_PACED}
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-[#F5F8FE] p-6 text-sm font-semibold text-[#2751DA]"
          title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}
        >
          {$questionnaireMetaData.finalTotalGrade}/{$questionnaireMetaData.totalPossibleGrade}
        </span>
      {/if}
    </div>

    {#if $questionnaireMetaData.status === STATUS.GRADED && $questionnaireMetaData.comment && $course.type !== COURSE_TYPE.SELF_PACED}
      <div class="bg-primary-700 mt-3 flex items-center justify-between rounded-sm p-4 text-white">
        <span> {$questionnaireMetaData.comment}</span>
      </div>
    {/if}
    <Preview
      questions={$questionnaire.questions.sort((a, b) => a.order - b.order)}
      questionnaireMetaData={$questionnaireMetaData}
      grades={$questionnaireMetaData.grades}
      disableGrading={true}
    />
  {/if}
{:else if currentQuestion && currentQuestion?.id}
  {#key currentQuestion.id}
    <!-- <div transition:fade id="question"> -->
    <div in:fly={{ x: 500, duration: 1000 }} id="question">
      {#if QUESTION_TYPE.RADIO === currentQuestion.question_type.id}
        <RadioQuestion {...renderProps} key={currentQuestion.id} hideGrading={true} />
      {:else if QUESTION_TYPE.CHECKBOX === currentQuestion.question_type.id}
        <CheckboxQuestion {...renderProps} key={currentQuestion.id} hideGrading={true} />
      {:else if QUESTION_TYPE.TEXTAREA === currentQuestion.question_type.id}
        <TextareaQuestion {...renderProps} key={currentQuestion.id} hideGrading={true} />
      {/if}
    </div>
  {/key}
{/if}

<style>
  .status-text {
    width: fit-content;
  }
</style>
