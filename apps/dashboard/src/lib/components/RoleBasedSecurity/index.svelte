<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '$lib/utils/constants/roles';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { GroupPerson } from '$lib/utils/types';
  import { group as courseGroup } from '../Course/store';
  import { group as pathwaysGroup } from '../Pathways/store';

  export let allowedRoles: number[] = [];
  export let onDenied = () => {};
  export let onlyStudent = false;

  let show: boolean = false;
  let userRole: number | null = null;

  function isAllowed(role: number | null): boolean {
    return role !== null && allowedRoles.includes(role);
  }

  $: {
    const courseUser: GroupPerson | undefined = $courseGroup.people.find(
      (person) => person.profile_id === $profile.id
    );
    const pathwaysUser: GroupPerson | undefined = $pathwaysGroup.people.find(
      (person) => person.profile_id === $profile.id
    );

    userRole = courseUser?.role_id ?? pathwaysUser?.role_id ?? null;

    if (!$isOrgAdmin && !isAllowed(userRole)) {
      onDenied();
    }
  }

  $: {
    if (onlyStudent) {
      show = userRole === ROLE.STUDENT;
    } else {
      show = isAllowed(userRole) || $isOrgAdmin;
    }
  }
</script>

{#if show}
  <slot />
{/if}
