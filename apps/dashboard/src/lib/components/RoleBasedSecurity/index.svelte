<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { group } from '../Course/store';
  import type { GroupPerson } from '$lib/utils/types';
  import { isOrgAdmin } from '$lib/utils/store/org';

  export let allowedRoles: number[] = [];
  export let onDenied = () => {};
  // Since orgAdmin can see all, we need a way to show the content only to students
  export let onlyStudent = false;

  let userRole: number = 0;
  let show = false;

  function isAllowed(userRole) {
    return allowedRoles.includes(userRole);
  }

  $: {
    const user: GroupPerson = $group.people.find((person) => person.profile_id === $profile.id)!;

    userRole = user ? user.role_id : userRole;

    if (!$isOrgAdmin && $group.people.length && !isAllowed(userRole)) {
      onDenied();
    }
  }

  $: if (onlyStudent) {
    show = isAllowed(userRole);
  } else {
    show = isAllowed(userRole) || $isOrgAdmin;
  }
</script>

{#if show}
  <slot />
{/if}
