<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ROLE } from '@cio/utils/constants';
  import { CourseInsightsPage } from '$features/insights';
  import { RoleBasedSecurity } from '$features/ui';

  let { data } = $props();
</script>

<RoleBasedSecurity
  allowedRoles={[ROLE.ADMIN, ROLE.TUTOR]}
  onDenied={() => goto(resolve(`/courses/${data.courseId}/lessons?next=true`, {}))}
>
  <CourseInsightsPage courseId={data.courseId} />
</RoleBasedSecurity>
