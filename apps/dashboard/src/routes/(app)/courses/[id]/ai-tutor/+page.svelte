<script lang="ts">
  import { CourseAiTutorSettingsPage } from '$features/ai-tutor-settings';

  let { data } = $props();
</script>

<CourseAiTutorSettingsPage courseId={data.courseId} />
