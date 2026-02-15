<script lang="ts">
  import { LessonPage } from '$features/course/pages';
  import { lessonApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import type { Lesson } from '$features/course/utils/types';

  interface Props {
    data: {
      courseId: string;
      lessonId: string;
      lesson: Lesson | null;
    };
  }

  let { data }: Props = $props();

  $effect(() => {
    console.log('data', data);
    if (!data.lesson) return;
    const lesson = data.lesson;

    if (lessonApi.lesson?.id === lesson.id) return;

    // Set lesson data
    lessonApi.lesson = lesson;

    // Set translations if lesson has lessonLanguages
    if (lesson.lessonLanguages) {
      lessonApi.setTranslations();
    }

    // Set current locale from profile if available
    if ($profile.locale) {
      lessonApi.currentLocale = $profile.locale;
    }
  });
</script>

{#key data.lessonId}
  <LessonPage courseId={data.courseId} lessonId={data.lessonId} />
{/key}
