<script lang="ts">
  import { untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { Spinner } from '@cio/ui/base/spinner';
  // import * as Chart from '@cio/ui/base/chart';
  // import { scaleBand } from '@cio/ui/base/chart';

  import { submissions } from './store';
  import { questionnaire } from '../../store/exercise';
  import { t } from '$lib/utils/functions/translations';
  import type { ExerciseSubmissions } from '$features/course/utils/types';
  import { replaceHTMLTag } from '$lib/utils/functions/course';

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
    type: number;
    chartData: TransformedQuestionChartData[];
  }

  let transformedQuestions: TransformedQuestion[] = $state([]);

  // Create dynamic chart config based on question data
  function getChartConfig(chartData: TransformedQuestionChartData[]): any {
    const config: any = {};
    chartData.forEach((item, index) => {
      config[`option${index}`] = {
        label: item.option,
        color: item.isCorrect ? '#22c55e' : `hsl(${index * 60}, 70%, 50%)`
      };
    });
    return config;
  }

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
      const questionTypeId = question.question_type_id;
      const transformedQuestion: {
        title: string;
        type: number;
        chartData: TransformedQuestionChartData[];
      } = {
        title: question.title,
        type: questionTypeId,
        chartData: []
      };

      // If textarea don't calculate the value just get the student's answer
      if (transformedQuestion.type === 3) {
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
          const { value, is_correct, label } = option;
          const chartData: TransformedQuestionChartData = {
            option: replaceHTMLTag(label || ''),
            responses: 0,
            isCorrect: is_correct
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

    console.log({ transformedQuestions });
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
        {#if q.type === 1}
          <!-- Pie Chart for Radio Questions (single choice) -->
          {@const chartConfig = getChartConfig(q.chartData)}
          {console.log('chartConfig', chartConfig)}
          <!-- <Chart.Container config={chartConfig} class="min-h-[300px] w-full">
            <Chart.PieChart data={q.chartData} value="responses" name="option" />
          </Chart.Container> -->
        {:else if q.type === 2}
          <!-- Bar Chart for Checkbox Questions (multiple choice) -->
          {@const chartConfig = getChartConfig(q.chartData)}
          {console.log('chartConfig', chartConfig)}
          <!-- <Chart.Container config={chartConfig} class="min-h-[300px] w-full">
            <Chart.BarChart
              data={q.chartData}
              xScale={scaleBand().padding(0.25)}
              x="option"
              y="responses"
              axis="x"
              tooltip={false}
              series={q.chartData.map((item, idx) => ({
                key: 'responses',
                label: item.option,
                color: item.isCorrect ? '#22c55e' : `hsl(${idx * 60}, 70%, 50%)`
              }))}
            />
          </Chart.Container> -->
        {:else}
          <!-- Text answers -->
          <div class="max-h-[250px] overflow-auto">
            <ul>
              {#each q.chartData as answer (answer)}
                {#if answer.option}
                  <div class="my-1 w-full rounded bg-slate-100 p-2 dark:bg-slate-300">
                    <li class="text-base font-medium text-black">{answer.option}</li>
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
