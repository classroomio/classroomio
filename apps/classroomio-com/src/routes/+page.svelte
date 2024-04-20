<script>
  import Hero from '$lib/Hero/Hero.svelte';
  import Body from '$lib/Body/Body.svelte';
  import Faq from '$lib/Faq/Faq.svelte';
  import StudentDashboard from '$lib/StudentDashboard/StudentDashboard.svelte';
  import MoreFeatures from '$lib/MoreFeatures/MoreFeatures.svelte';
  import Testimonial from '$lib/Testimonial/Testimonial.svelte';

  import { PUBLIC_ENABLE_FAQ } from '$env/static/public';
</script>

<Hero />
<Body />
<StudentDashboard />
<Testimonial />
<MoreFeatures />


{#if PUBLIC_ENABLE_FAQ}
  <Faq />
{/if}
