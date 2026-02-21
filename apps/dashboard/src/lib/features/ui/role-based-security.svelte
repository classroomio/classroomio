<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { courseApi } from '$features/course/api';
  import { isOrgAdmin } from '$lib/utils/store/org';

  interface Props {
    allowedRoles?: number[];
    onDenied?: any;
    // Since orgAdmin can see all, we need a way to show the content only to students
    onlyStudent?: boolean;
    children?: import('svelte').Snippet;
  }

  let { allowedRoles = [], onDenied = () => {}, onlyStudent = false, children }: Props = $props();

  const userRole: number | null = $derived.by(() => {
    const user = courseApi.group.people.find((person) => person.profileId === $profile.id);
    return user ? Number(user.roleId) : null;
  });

  const show = $derived.by(() => {
    if (onlyStudent) {
      return isAllowed(userRole);
    } else {
      return isAllowed(userRole) || !!$isOrgAdmin;
    }
  });

  function isAllowed(userRole: number | null) {
    if (userRole === null) return false;
    return allowedRoles.includes(userRole);
  }

  $effect(() => {
    if (!$isOrgAdmin && userRole !== null && !isAllowed(userRole)) {
      onDenied();
    }
  });
</script>

{#if show}
  {@render children?.()}
{/if}
