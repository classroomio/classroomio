<script lang="ts">
  import { Toaster } from '$lib/components/ui/sonner';
  import { Navigation } from '$lib/components/navigation';
  import posthog from 'posthog-js';
  import { dev } from '$app/environment';

  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    if (dev) return;

    posthog.init('phc_JfdHOZ6v0cVlGELBYx1Tmoen2nxNOrAzvgvrPA6Ksov', {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
    });
  });
</script>

<Toaster />

<Navigation />

{@render children()}
