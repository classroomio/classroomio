<script lang="ts">
  import { LessonPage } from '$features/course/pages';
  import { lessonApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import type { Lesson } from '$features/course/utils/types';
  import * as Page from '@cio/ui/base/page';

  interface Props {
    data: {
      courseId: string;
      lessonId: string;
      lesson: Lesson | null;
    };
  }

  let { data }: Props = $props();

  $effect(() => {
    if (!data.lessonId) return;

    if (!data.lesson) {
      if (lessonApi.lesson?.id === data.lessonId) {
        lessonApi.lesson = null;
      }

      return;
    }

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

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-4xl lg:max-w-5xl">
  {#key data.lessonId}
    <LessonPage courseId={data.courseId} lessonId={data.lessonId} />
  {/key}
</Page.Root>
