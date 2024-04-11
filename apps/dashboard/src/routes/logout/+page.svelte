<script lang="ts">
  import { onMount } from 'svelte';
  import { logout } from '$lib/utils/functions/logout';

  onMount(() => {
    logout();
  });
</script>

<div class="app-background w-full min-h-screen flex items-center justify-center">
  <div>Logging you out...</div>
</div>
