<script>
  import { Footer, Navigation } from '$lib';
  import PageTransition from './transition.svelte';
  import '../app.css';

  export let data;
</script>

<div class="overflow-hidden">
  <Navigation />

  <PageTransition url={data.url}>
    <slot />
  </PageTransition>

  <Footer />
</div>
