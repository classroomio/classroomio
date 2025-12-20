<script lang="ts">
  import { PeoplePage } from '$features/course/pages';

  let { data } = $props();
</script>

<PeoplePage courseId={data.courseId} />
