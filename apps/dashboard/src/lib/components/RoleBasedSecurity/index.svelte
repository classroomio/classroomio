<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { group } from '../Course/store';
  import type { GroupPerson } from '$lib/utils/types';

  export let allowedRoles: number[] = [];

  let userRole: number = 0;

  $: {
    const user: GroupPerson = $group.people.find((person) => person.profile_id === $profile.id)!;

    userRole = user ? user.role_id : userRole;
  }
</script>

{#if allowedRoles.includes(userRole)}
  <slot />
{/if}
