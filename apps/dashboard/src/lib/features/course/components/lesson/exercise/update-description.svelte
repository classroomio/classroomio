<script lang="ts">
  import { questionnaire } from '../store/exercise';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { t } from '$lib/utils/functions/translations';

  import { InputField } from '@cio/ui/custom/input-field';
  import { TextEditor } from '$features/ui';
  import { QuestionContainer } from '$features/course/components';

  interface Props {
    preview: boolean;
  }

  let { preview }: Props = $props();

  function getTotalPossibleGrade(questions: { points: number | string }[]) {
    return questions.reduce((acc, question) => {
      acc += typeof question.points === 'string' ? parseFloat(question.points) : question.points;
      return acc;
    }, 0);
  }
</script>

<div class="mb-5 {!preview ? 'px-6' : 'px-2'}">
  <QuestionContainer isTitle={true}>
    {#if !preview}
      <InputField
        placeholder={$t('course.navItem.lessons.exercises.all_exercises.description.title')}
        bind:value={$questionnaire.title}
        className="mb-2"
        onchange={() => ($questionnaire.isTitleDirty = true)}
      />
      <InputField
        label={$t('course.navItem.lessons.exercises.all_exercises.view_mode.due')}
        className="w-50"
        type="datetime-local"
        value={$questionnaire.dueBy ?? ''}
        onchange={(e) => {
          $questionnaire.dueBy = e.currentTarget.value;
          $questionnaire.isDueByDirty = true;
        }}
      />

      <div class="mt-3">
        <p class="mb-1">
          {$t('course.navItem.lessons.exercises.all_exercises.description.heading')}
        </p>

        <TextEditor
          content={$questionnaire.description || ''}
          onChange={(html) => {
            $questionnaire.isDescriptionDirty = true;
            $questionnaire.description = html;
          }}
          editorClass="max-h-[300px]"
          placeholder={$t('course.navItem.lessons.exercises.all_exercises.description.describe')}
        />
      </div>
    {:else if preview}
      <h2 class="my-1">{$questionnaire.title}</h2>
      <div class="flex items-center">
        <p class="mx-2 dark:text-white">
          <strong>{$questionnaire.questions.length}</strong>
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.questions')}
        </p>
        |
        <p class="mx-2 dark:text-white">
          <strong>{getTotalPossibleGrade($questionnaire.questions)}</strong>
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.points')}.
        </p>
        |
        <p class="mx-2 dark:text-white">
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.all')}
        </p>
        {#if $questionnaire.dueBy}
          |
          <p class="mx-2 dark:text-white">
            <strong>{$t('course.navItem.lessons.exercises.all_exercises.view_mode.due')}:</strong>
            {new Date($questionnaire.dueBy).toLocaleString()}
          </p>
        {/if}
      </div>

      <article class="preview prose prose-sm sm:prose mt-3 p-2">
        {@html sanitizeHtml(
          $questionnaire.description || $t('course.navItem.lessons.exercises.all_exercises.description.no')
        )}
      </article>
    {/if}
  </QuestionContainer>
</div>
