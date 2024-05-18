<script lang="ts">
  // import { ROLE } from '$lib/utils/constants/roles';
  import { profile } from '$lib/utils/store/user';
  import { group } from '../Course/store';
  import type { Person } from '../Course/components/People/types';

  export let allowedRoles: number[] = [];

  let userRole: number = 0;

  $: {
    const user: Person = $group.people.find(
      (person: { profile_id: number }) => person.profile_id === $profile.id
    )!;

    if (user) {
      userRole = user.role_id;
    }
  }

  $: console.log({ group: $group });
  $: console.log(
    'is allowed',
    allowedRoles.includes(userRole),
    'roles',
    userRole,
    'allowedRoles',
    allowedRoles
  );
</script>

{#if allowedRoles.includes(userRole)}
  <slot />
{/if}
