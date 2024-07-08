<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { group } from '../Course/store';
  import type { GroupPerson } from '$lib/utils/types';
  import { isOrgAdmin } from '$lib/utils/store/org';

  export let allowedRoles: number[] = [];
  export let onDenied = () => {};

  let userRole: number = 0;

  $: {
    const user: GroupPerson = $group.people.find((person) => person.profile_id === $profile.id)!;

    userRole = user ? user.role_id : userRole;

    if (!$isOrgAdmin && $group.people.length && !allowedRoles.includes(userRole)) {
      onDenied();
    }
  }
</script>

{#if allowedRoles.includes(userRole) || $isOrgAdmin}
  <slot />
{/if}
