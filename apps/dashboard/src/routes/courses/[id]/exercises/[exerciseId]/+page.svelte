<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { ExercisePage } from '$features/course/pages';
  import { questionnaire, clearQuestionnaireValidation } from '$lib/features/course/components/exercise/store.js';
  import { globalStore } from '$lib/utils/store/app';
  import type { Question } from '$features/course/types';

  let { data = $bindable() } = $props();

  const path = `/courses/${data.courseId}/lessons`;

  $effect(() => {
    if (!data.exercise) return;

    clearQuestionnaireValidation();

    const exercise = data.exercise;

    // Check if student and exercise is locked - redirect if so
    if ($globalStore.isStudent && exercise.isUnlocked === false) {
      goto(resolve(path, {}));
      return;
    }

    // Transform questions and set questionnaire store
    let questions: Question[] = [];
    if (exercise.questions && Array.isArray(exercise.questions)) {
      questions = exercise.questions
        .map((question) => {
          const questionType = QUESTION_TYPES.find((type) => type.id === question.questionType?.id);
          return {
            ...question,
            questionType: questionType || question.questionType
          };
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    questionnaire.set({
      title: exercise.title,
      description: exercise.description,
      dueBy: exercise.dueBy,
      isTitleDirty: false,
      isDescriptionDirty: false,
      isDueByDirty: false,
      questions: questions,
      totalSubmissions: 0
    });
  });
</script>

<ExercisePage exerciseId={data.exerciseId} {path} goBack={() => goto(resolve(path, {}))} isFetching={false} />
