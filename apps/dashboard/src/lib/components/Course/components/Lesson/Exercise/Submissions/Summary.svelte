<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { ExerciseSubmissions } from '$lib/utils/types';
  import { questionnaire } from '../../store/exercise';
  import { replaceHTMLTag } from '$lib/utils/functions/course';
  import type {
    BarChartOptions,
    PieChartOptions,
    PieChart,
    BarChartSimple
  } from '@carbon/charts-svelte';
  import { getChartOptions } from './functions';
  import { submissions } from './store';
  import '@carbon/charts-svelte/styles.css';
  import { Loading } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';

  export let isLoading = true;

  type TranformedQuestionChartData = {
    group: string;
    value: number;
    isCorrect?: boolean;
  };
  interface TranformedQuestion {
    title: string;
    type: number;
    chartData: TranformedQuestionChartData[];
  }

  let transformedQuestions: TranformedQuestion[] = [];
  let barChart: typeof BarChartSimple;
  let pieChart: typeof PieChart;
  let pieOptions: PieChartOptions;
  let barOptions: BarChartOptions;

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
    const _transformedQuestions: TranformedQuestion[] = [];

    $questionnaire.questions.forEach(
      (question: {
        id: number;
        title: string;
        question_type_id: number;
        options: { value: string; is_correct: boolean; label: string }[];
      }) => {
        const transformedQuestion: {
          title: string;
          type: number;
          chartData: TranformedQuestionChartData[];
        } = {
          title: question.title,
          type: question.question_type_id,
          chartData: []
        };

        // If textarea don't calculate the value just get the student's answer
        if (transformedQuestion.type === 3) {
          $submissions.forEach((submission) => {
            const chartData: TranformedQuestionChartData = {
              group: getAnswerToQuestionOfStudent(question.id, true, submission)[0],
              value: 0
            };

            // Update the transformed question chartData
            transformedQuestion.chartData.push(chartData);
          });
        } else {
          // radio or checkbox
          question.options.forEach((option) => {
            const { value, is_correct, label } = option;
            const chartData: TranformedQuestionChartData = {
              group: replaceHTMLTag(label),
              value: 0,
              isCorrect: is_correct
            };

            $submissions.forEach((studentSubmission) => {
              const studentAnswer = getAnswerToQuestionOfStudent(
                question.id,
                false,
                studentSubmission
              );

              if (studentAnswer.includes(value)) {
                chartData.value += 1;
              }
            });
            transformedQuestion.chartData.push(chartData);
          });
        }

        _transformedQuestions.push(transformedQuestion);
      }
    );

    transformedQuestions = [..._transformedQuestions];

    console.log({ transformedQuestions });
  };

  onMount(async () => {
    const charts = await import('@carbon/charts-svelte');
    barChart = charts.BarChartSimple;
    pieChart = charts.PieChart;
  });

  $: browser && $submissions?.length && getTransformedData($submissions);

  $: {
    let chartOptions = getChartOptions(isLoading);
    barOptions = chartOptions.barOptions;
    pieOptions = chartOptions.pieOptions;

    console.log({ chartOptions });
  }
</script>

{#if isLoading}
  <Loading withOverlay={true} />
{:else if browser}
  <div>
    <p class="text-2xl mb-3">
      {$t('course.navItem.lessons.exercises.all_exercises.analytics.summary.question_chart')}
    </p>
    {#each transformedQuestions as q}
      <div class="mb-4">
        <p>{q.title}</p>
        {#if q.type === 1}
          <svelte:component this={pieChart} data={q.chartData} options={pieOptions} />
        {:else if q.type === 2}
          <svelte:component this={barChart} data={q.chartData} options={barOptions} />
        {:else}
          <div class="max-h-[250px] overflow-auto">
            <ul>
              {#each q.chartData as answer (answer)}
                {#if answer.group}
                  <div class="rounded bg-slate-100 dark:bg-slate-300 p-2 my-1 w-full">
                    <li class="text-base font-medium text-black">{answer.group}</li>
                  </div>
                {/if}
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
