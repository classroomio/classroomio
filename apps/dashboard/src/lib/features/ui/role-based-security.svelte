<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { courseApi } from '$features/course/api';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { isStudentExperience } from '$lib/utils/store/app';
  import { ROLE } from '@cio/utils/constants';

  interface Props {
    allowedRoles?: number[];
    onDenied?: any;
    // Since orgAdmin can see all, we need a way to show the content only to students
    onlyStudent?: boolean;
    children?: import('svelte').Snippet;
  }

  let { allowedRoles = [], onDenied = () => {}, onlyStudent = false, children }: Props = $props();

  const userRole: number | null = $derived.by(() => {
    // In the student experience everyone is treated as a student, so a teacher
    // previews exactly what a student sees — no matter their real course role.
    if ($isStudentExperience) return ROLE.STUDENT;

    const user = courseApi.group.people.find((person) => person.profileId === $profile.id);
    return user ? Number(user.roleId) : null;
  });

  const show = $derived.by(() => {
    // No org-admin bypass while in the student experience — treat the viewer as a student.
    if (onlyStudent || $isStudentExperience) {
      return isAllowed(userRole);
    }

    return isAllowed(userRole) || !!$isOrgAdmin;
  });

  function isAllowed(userRole: number | null) {
    if (userRole === null) return false;
    return allowedRoles.includes(userRole);
  }

  $effect(() => {
    const determined = $isStudentExperience || userRole !== null;
    if (determined && !show) {
      onDenied();
    }
  });
</script>

{#if show}
  {@render children?.()}
{/if}
