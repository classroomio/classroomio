<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { group } from '../Course/store';
  import type { GroupPerson } from '$lib/utils/types';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { ROLE } from '$lib/utils/constants/roles';

  export let allowedRoles: number[] = [1, 2, 3];
  export let onDenied = () => {};
  export let onlyStudent = false;

  let userRole: number = 0;

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

  $: show = onlyStudent ? isAllowed(ROLE.STUDENT) : isAllowed(userRole) || $isOrgAdmin;
</script>

{#if show}
  <slot />
{/if}
