<script>
  import { Footer, Navigation } from '$lib';
  import '../app.css';
</script>

<div class="overflow-hidden">
  <Navigation />
  <div class="mt-[30%] md:my-36">
    <slot />
  </div>

  <Footer />
</div>
