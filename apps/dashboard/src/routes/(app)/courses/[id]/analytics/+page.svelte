<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ROLE } from '@cio/utils/constants';
  import { CourseAnalyticsPage } from '$features/analytics';
  import { RoleBasedSecurity } from '$features/ui';

  let { data } = $props();
</script>

<RoleBasedSecurity
  allowedRoles={[ROLE.ADMIN, ROLE.TUTOR]}
  onDenied={() => goto(resolve(`/courses/${data.courseId}/lessons?next=true`, {}))}
>
  <CourseAnalyticsPage courseId={data.courseId} />
</RoleBasedSecurity>
