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

  let userRole: number = 0;

  function isAllowed(userRole: number): boolean {
    return allowedRoles.includes(userRole);
  }

  $: {
    const courseUser: GroupPerson = $courseGroup.people.find(
      (person) => person.profile_id === $profile.id
    )!;
    const pathwaysUser: GroupPerson = $pathwaysGroup.people.find(
      (person) => person.profile_id === $profile.id
    )!;

    userRole = courseUser ? courseUser.role_id : pathwaysUser ? pathwaysUser.role_id : userRole;

    if (
      !$isOrgAdmin &&
      ($courseGroup.people.length || $pathwaysGroup.people.length) &&
      !isAllowed(userRole)
    ) {
      onDenied();
    }
  }

  $: show = onlyStudent ? isAllowed(ROLE.STUDENT) : isAllowed(userRole) || $isOrgAdmin;
</script>

{#if show}
  <slot />
{/if}
