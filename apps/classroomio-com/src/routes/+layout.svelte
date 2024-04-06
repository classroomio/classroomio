<script>
  import Navigation from '$lib/Navigation/Navigation.svelte';
  import Footer from '$lib/Footer/Footer.svelte';
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
