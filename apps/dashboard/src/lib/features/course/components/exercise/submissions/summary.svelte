<script lang="ts">
  import { untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { Spinner } from '@cio/ui/base/spinner';
  // import * as Chart from '@cio/ui/base/chart';
  // import { scaleBand } from '@cio/ui/base/chart';

  import { submissions } from './store';
  import { questionnaire } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from '$features/course/utils/types';
  import { replaceHTMLTag } from '$lib/utils/functions/course';
  import { getQuestionTypeKey, questionTypeSupportsOptions } from '../question-type-utils';

  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = $bindable(true) }: Props = $props();

  type TransformedQuestionChartData = {
    option: string;
    responses: number;
    isCorrect?: boolean;
  };

  interface TransformedQuestion {
    title: string;
    chartData: TransformedQuestionChartData[];
  }

  let transformedQuestions: TransformedQuestion[] = $state([]);

  function getAnswerToQuestionOfStudent(
    questionId: number,
    isTextArea: boolean,
    submission: ExerciseSubmissions
  ): string[] {
    let questionSubmission: string[] = [];

    // find the answer by this student to this question (questionId)
    const studentAnswer = submission.answers.find((a) => a.question_id === questionId);

    if (studentAnswer) {
      const { answers, open_answer } = studentAnswer;
      if (isTextArea) {
        questionSubmission = [open_answer];
      } else {
        questionSubmission = answers;
      }
    }

    return questionSubmission;
  }

  const getTransformedData = ($submissions: ExerciseSubmissions[]): void => {
    const _transformedQuestions: TransformedQuestion[] = [];

    $questionnaire.questions.forEach((question) => {
      const questionId = typeof question.id === 'string' ? parseInt(question.id, 10) : question.id;
      const questionTypeKey = getQuestionTypeKey(question);
      const transformedQuestion: {
        title: string;
        chartData: TransformedQuestionChartData[];
      } = {
        title: question.title,
        chartData: []
      };

      // If textarea don't calculate the value just get the student's answer
      if (!questionTypeSupportsOptions(questionTypeKey)) {
        $submissions.forEach((submission) => {
          const answer = getAnswerToQuestionOfStudent(questionId, true, submission);
          const chartData: TransformedQuestionChartData = {
            option: answer[0] || '',
            responses: 0
          };

          // Update the transformed question chartData
          transformedQuestion.chartData.push(chartData);
        });
      } else {
        // radio or checkbox
        question.options.forEach((option) => {
          const { value, isCorrect, label } = option;
          const chartData: TransformedQuestionChartData = {
            option: replaceHTMLTag(label || ''),
            responses: 0,
            isCorrect: isCorrect
          };

          $submissions.forEach((studentSubmission) => {
            const studentAnswer = getAnswerToQuestionOfStudent(questionId, false, studentSubmission);

            if (value && studentAnswer.includes(value)) {
              chartData.responses += 1;
            }
          });
          transformedQuestion.chartData.push(chartData);
        });
      }

      _transformedQuestions.push(transformedQuestion);
    });

    untrack(() => {
      transformedQuestions = [..._transformedQuestions];
    });
  };

  $effect(() => {
    if ($submissions?.length) {
      getTransformedData($submissions);
    }
  });
</script>

{#if isLoading}
  <Spinner />
{:else if browser}
  <div>
    <p class="mb-3 text-2xl">
      {$t('course.navItem.lessons.exercises.all_exercises.analytics.summary.question_chart')}
    </p>
    {#each transformedQuestions as q}
      <div class="mb-6">
        <p class="mb-3 font-medium">{q.title}</p>
        <div class="max-h-[250px] overflow-auto">
          <ul>
            {#each q.chartData as answer, index (`${answer.option}-${index}`)}
              {#if answer.option}
                <li class="my-1 w-full rounded bg-slate-100 p-2 text-base font-medium text-black dark:bg-slate-300">
                  <div class="flex items-center justify-between gap-3">
                    <span>{answer.option}</span>
                    {#if answer.responses > 0}
                      <span class="text-xs font-semibold text-gray-700">
                        {answer.responses}
                      </span>
                    {/if}
                  </div>
                </li>
              {/if}
            {/each}
          </ul>
        </div>
      </div>
    {/each}
  </div>
{/if}
