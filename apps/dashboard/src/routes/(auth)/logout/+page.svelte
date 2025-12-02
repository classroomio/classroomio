<script lang="ts">
  import { onMount } from 'svelte';
  import { logout } from '$lib/utils/functions/logout';

  onMount(() => {
    logout();
  });
</script>

<div class="flex min-h-screen w-full items-center justify-center">
  <div>Logging you out...</div>
</div>
