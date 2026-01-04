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

  const userRole: number = $derived.by(() => {
    const user = courseApi.group.people.find((person) => person.profileId === $profile.id);
    return user ? Number(user.roleId) : 0;
  });

  const show = $derived.by(() => {
    if (onlyStudent) {
      return isAllowed(userRole);
    } else {
      return isAllowed(userRole) || !!$isOrgAdmin;
    }
  });

  function isAllowed(userRole) {
    return allowedRoles.includes(userRole);
  }

  $effect(() => {
    if (!$isOrgAdmin && courseApi.group.people.length && !isAllowed(userRole)) {
      onDenied();
    }
  });
</script>

{#if show}
  {@render children?.()}
{/if}
