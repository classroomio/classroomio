<script lang="ts">
  import { Toaster } from '$lib/components/ui/sonner';
  import { Navigation } from '$lib/components/navigation';
  import posthog from 'posthog-js';

  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    posthog.init('phc_5eTGKfeGcwOjhS05omKVvnSP1OBS6w2y5JsOVTYhb0J', {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
    });
  });
</script>

<Toaster />

<Navigation />

{@render children()}
