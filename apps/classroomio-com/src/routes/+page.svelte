<script>
  import Hero from '$lib/Home/Hero.svelte';
  import CoreFeatures from '$lib/Home/CoreFeatures.svelte';
  import Faq from '$lib/Home/Faq.svelte';
  import StudentDashboard from '$lib/Home/StudentDashboard.svelte';
  import MoreFeatures from '$lib/Home/MoreFeatures.svelte';
  import Testimonial from '$lib/Home/Testimonial.svelte';

  import { PUBLIC_ENABLE_FAQ } from '$env/static/public';
</script>

<Hero />
<CoreFeatures />
<StudentDashboard />
<Testimonial />
<MoreFeatures />

{#if PUBLIC_ENABLE_FAQ}
  <Faq />
{/if}
