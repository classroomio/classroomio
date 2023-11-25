<script>
  import { Footer, Navigation } from '$lib';
  import '../app.css';
</script>

<div class="overflow-hidden">
  <Navigation />
  <slot />

  <Footer />
</div>
