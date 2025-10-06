<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { group } from '../Course/store';
  import type { GroupPerson } from '$lib/utils/types';
  import { isOrgAdmin } from '$lib/utils/store/org';

  interface Props {
    allowedRoles?: number[];
    onDenied?: any;
    // Since orgAdmin can see all, we need a way to show the content only to students
    onlyStudent?: boolean;
    children?: import('svelte').Snippet;
  }

  let { allowedRoles = [], onDenied = () => {}, onlyStudent = false, children }: Props = $props();

  let userRole: number = $state(0);
  let show = $state(false);

  function isAllowed(userRole) {
    return allowedRoles.includes(userRole);
  }

  $effect(() => {
    const user: GroupPerson = $group.people.find((person) => person.profile_id === $profile.id)!;

    userRole = user ? user.role_id : userRole;

    if (!$isOrgAdmin && $group.people.length && !isAllowed(userRole)) {
      onDenied();
    }
  });

  $effect(() => {
    if (onlyStudent) {
      show = isAllowed(userRole);
    } else {
      show = isAllowed(userRole) || $isOrgAdmin;
    }
  });
</script>

{#if show}
  {@render children?.()}
{/if}
