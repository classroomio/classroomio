<script>
  import { Hero, CoreFeatures, Faq, StudentDashboard, MoreFeatures, Testimonial } from '$lib/components';
  import { PUBLIC_ENABLE_FAQ } from '$env/static/public';

  import { onMount } from 'svelte';

  onMount(() => {
    console.log('Welcome to CIO');
  });
</script>

<Hero />
<CoreFeatures />
<StudentDashboard />
<Testimonial />
<MoreFeatures />

{#if PUBLIC_ENABLE_FAQ}
  <Faq />
{/if}
