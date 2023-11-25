<script>
  import {
    Body,
    Faq,
    Hero,
    Pricing,
    StudentDashboard,
    MoreFeatures,
  } from '$lib';
  import { PUBLIC_ENABLE_PRICING, PUBLIC_ENABLE_FAQ } from '$env/static/public';
</script>

<Hero />
<Body />
<StudentDashboard />
<MoreFeatures />

{#if PUBLIC_ENABLE_PRICING}
  <Pricing />
{/if}
{#if PUBLIC_ENABLE_FAQ}
  <Faq />
{/if}
