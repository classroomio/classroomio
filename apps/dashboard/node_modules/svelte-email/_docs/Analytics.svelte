<script>import { page } from "$app/stores";
$: {
  if (typeof gtag !== "undefined") {
    gtag("config", "G-583B58BZRR", {
      page_title: document.title,
      page_path: $page.url.pathname
    });
  }
}
</script>

<svelte:head>
  <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=G-583B58BZRR">
  </script>
  <script>
    window.dataLayer = window.dataLayer || []

    function gtag() {
      dataLayer.push(arguments)
    }

    gtag('js', new Date())
    gtag('config', 'G-583B58BZRR')
  </script>
</svelte:head>
