<script>
  import Hero from '$lib/Home/Hero.svelte';
  import CoreFeatures from '$lib/Home/CoreFeatures.svelte';
  import Faq from '$lib/Home/Faq.svelte';
  import StudentDashboard from '$lib/Home/StudentDashboard.svelte';
  import MoreFeatures from '$lib/Home/MoreFeatures.svelte';
  import Testimonial from '$lib/Home/Testimonial.svelte';

  import { env } from '$env/dynamic/public';
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

{#if env.PUBLIC_ENABLE_FAQ}
  <Faq />
{/if}
