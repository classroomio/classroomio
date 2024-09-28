<script>
  import Hero from '$lib/Hero/Hero.svelte';
  import Body from '$lib/Body/Body.svelte';
  import Faq from '$lib/Faq/Faq.svelte';
  import StudentDashboard from '$lib/StudentDashboard/StudentDashboard.svelte';
  import MoreFeatures from '$lib/MoreFeatures/MoreFeatures.svelte';
  import Testimonial from '$lib/Testimonial/Testimonial.svelte';

  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('Welcome to CIO');
  });
</script>

<Hero />
<Body />
<StudentDashboard />
<Testimonial />
<MoreFeatures />

{#if env.PUBLIC_ENABLE_FAQ}
  <Faq />
{/if}
