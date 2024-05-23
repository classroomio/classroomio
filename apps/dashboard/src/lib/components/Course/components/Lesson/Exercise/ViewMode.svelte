<script lang="ts">
  import { fly } from 'svelte/transition';
  import { group, course } from '$lib/components/Course/store';
  import { questionnaire } from '../store/exercise';
  import { questionnaireMetaData } from '../store/answers';
  import Preview from './Preview.svelte';
  import RadioQuestion from '$lib/components/Question/RadioQuestion/index.svelte';
  import CheckboxQuestion from '$lib/components/Question/CheckboxQuestion/index.svelte';
  import TextareaQuestion from '$lib/components/Question/TextareaQuestion/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import Progress from '$lib/components/Progress/index.svelte';
  import { removeDuplicate } from '$lib/utils/functions/removeDuplicate';
  import { QUESTION_TYPE } from '$lib/components/Question/constants';
  import { STATUS } from './constants';
  import { getPropsForQuestion, filterOutDeleted } from './functions';
  import { formatAnswers, getGroupMemberId } from '$lib/components/Course/function';
  import { submitExercise } from '$lib/utils/services/courses';
  import { fetchSubmission } from '$lib/utils/services/submissions';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';
  import { lesson } from '../store/lessons';
  import { browser } from '$app/environment';
  import { COURSE_TYPE } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  export let preview: boolean = false;
  export let exerciseId = '';
  export let isFetchingExercise = false;

  let currentQuestion = {};
  let renderProps = {};
  let submission;
  let hasSubmission = false;
  let isLoadingAutoSavedData = false;
  let alreadyCheckedAutoSavedData = false;
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

  async function onSubmit(id, value, moveToNextQuestion = false) {
    const { answers } = $questionnaireMetaData;
    const { questions } = $questionnaire;
    const prevAnswer = answers[id] || [];

    const formattedAnswer =
      typeof value === 'string' ? value : removeDuplicate([...prevAnswer, ...(value || [])]);

    $questionnaireMetaData.answers = {
      ...answers,
      [id]: formattedAnswer
    };

    if (moveToNextQuestion) {
      $questionnaireMetaData.currentQuestionIndex += 1;
      localStorage.setItem(
        `autosave-exercise-${exerciseId}`,
        JSON.stringify($questionnaireMetaData)
      );
    }

    const isFinished = !questions[$questionnaireMetaData.currentQuestionIndex - 1];
    console.log(`isFinished`, isFinished);
    console.log(
      `$questionnaireMetaData.currentQuestionIndex`,
      $questionnaireMetaData.currentQuestionIndex
    );

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
        submissionId = submissionResponse.submission[0]?.id;
      }
      notifyEducator();
    }
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
      acc += parseFloat(question.points, 10);
      return acc;
    }, 0);
  }

  async function checkForSubmission(people, profileId?: string, courseId?: string) {
    if (!Array.isArray(people) || !profileId || !courseId || !!submission) {
      return;
    }

    if (hasSubmission) return;

    const args = {
      exerciseId,
      courseId,
      submittedBy: getGroupMemberId(people, profileId)
    };
    const { data } = await fetchSubmission(args);
    hasSubmission = true;

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

    const stringifiedQuestionnaireMetaData = localStorage.getItem(
      `autosave-exercise-${exerciseId}`
    );

    if (stringifiedQuestionnaireMetaData) {
      const autoSavedData = JSON.parse(stringifiedQuestionnaireMetaData);
      if (autoSavedData) {
        $questionnaireMetaData = autoSavedData;
      }
    }
    isLoadingAutoSavedData = false;
    alreadyCheckedAutoSavedData = true;
  }

  $: browser && !alreadyCheckedAutoSavedData && getAutoSavedData();

  // Reactive code
  $: if (alreadyCheckedAutoSavedData && $questionnaire.questions.length > 0) {
    currentQuestion = $questionnaire.questions[$questionnaireMetaData.currentQuestionIndex - 1];
    if ($questionnaireMetaData.currentQuestionIndex > 0 && !currentQuestion) {
      $questionnaireMetaData.isFinished = true;
    }

    if (currentQuestion) {
      renderProps = getPropsForQuestion(
        $questionnaire.questions,
        currentQuestion,
        $questionnaireMetaData,
        $questionnaireMetaData.currentQuestionIndex,
        onSubmit,
        onPrevious,
        preview
      );
    }
    $questionnaireMetaData.progressValue = getProgressValue(
      $questionnaireMetaData.currentQuestionIndex
    );
  }

  $: !isFetchingExercise && checkForSubmission($group.people, $profile.id, $course.id);
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished}
  <Progress value={$questionnaireMetaData.progressValue} />
{/if}

{#if preview}
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <Preview
      questions={filterOutDeleted($questionnaire.questions)}
      questionnaireMetaData={$questionnaireMetaData}
    />
  </RoleBasedSecurity>
{:else if !$questionnaire.questions.length}
  <Box>
    <img src="/images/empty-exercise-icon.svg" alt="Exercise svg" class="my-2.5" />
    <h2 class="text-xl my-1.5">No question added for this exercise</h2>
    <p class="text-sm text-center px-44">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        Click the <span class="text-primary-700">Edit</span> button to add.
      </RoleBasedSecurity>
    </p>
  </Box>
{:else if $questionnaireMetaData.currentQuestionIndex === 0}
  <RoleBasedSecurity allowedRoles={[3]}>
    <div>
      <h2 class="my-1">{$questionnaire.title}</h2>

      <div class="flex items-center">
        <p class="dark:text-white mx-2">
          <strong>{$questionnaire.questions.length}</strong> questions
        </p>
        |
        <p class="dark:text-white mx-2">
          <strong>{getTotalPossibleGrade($questionnaire.questions)}</strong> points.
        </p>
        |
        <p class="dark:text-white mx-2">All required</p>
        {#if $questionnaire.due_by}
          |
          <p class="dark:text-white mx-2">
            <strong>Due by:</strong>
            {new Date($questionnaire.due_by).toLocaleString()}
          </p>
        {/if}
      </div>

      <article class="mt-3 preview prose prose-sm sm:prose p-2">
        {@html $questionnaire.description || 'No desription'}
      </article>

      <PrimaryButton
        onClick={handleStart}
        label="Start"
        className="my-5 float-right"
        type="button"
      />
    </div>
  </RoleBasedSecurity>
{:else if $questionnaireMetaData.isFinished}
  {#if !isLoadingAutoSavedData}
    <div class="flex items-center justify-between">
      <div class="flex flex-col lg:flex-row items-start lg:items-center lg:space-x-4 w-full">
        <h2 class="text-xl font-normal">{$questionnaire.title}</h2>

        {#if STATUS.GRADED === $questionnaireMetaData.status}
          <span
            class="status-text bg-green-700 text-white py-1 px-2 text-center"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.graded')}
          </span>
        {:else if $course.type === COURSE_TYPE.SELF_PACED}
          <span
            class="status-text bg-green-700 text-white py-1 px-2 text-center"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_submitted')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.submitted')}
          </span>
        {:else}
          <span
            class="status-text bg-yellow-600 text-white py-1 px-2 text-center"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_pending')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.pending')}
          </span>
        {/if}
      </div>
      {#if STATUS.GRADED === $questionnaireMetaData.status && $course.type !== COURSE_TYPE.SELF_PACED}
        <span
          class="p-6 border-2 border-gray-300 bg-[#F5F8FE] rounded-full h-10 w-10 flex items-center justify-center text-[#2751DA] text-sm font-semibold"
          title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}
        >
          {$questionnaireMetaData.finalTotalGrade}/{$questionnaireMetaData.totalPossibleGrade}
        </span>
      {/if}
    </div>

    {#if $questionnaireMetaData.status === STATUS.GRADED && $questionnaireMetaData.comment && $course.type !== COURSE_TYPE.SELF_PACED}
      <div
        class="flex items-center justify-between bg-primary-700 p-4 text-white font-semibold rounded-sm mt-3"
      >
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
  :global(.shake) {
    animation: shake 0.85s;
  }
  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-15px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(15px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-15px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(15px, 0, 0);
    }
  }
</style>
