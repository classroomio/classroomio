<script lang="ts">
  import { LessonPage } from '$features/course/pages';

  interface Props {
    data: {
      courseId: string;
      lessonId: string;
    };
  }

  let { data = $bindable() }: Props = $props();
</script>

<LessonPage courseId={data.courseId} lessonId={data.lessonId} />
