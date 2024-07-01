<script>
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
</script>

<svelte:head>
  <title>Free Tools | ClassroomIO</title>
  <meta
    property="og:image"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />
  <meta property="og:title" content="ClassroomIO Free Tools" />
  <meta
    property="og:description"
    content="At ClassroomIO, we have built a suit of tools for anyone to use freely while collaborating with students"
  />

  <meta
    property="og:image:secure_url"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />

  <meta name="twitter:title" content="ClassroomIO Free Tools" />
  <meta
    name="twitter:description"
    content="At ClassroomIO, we have built a suit of tools for anyone to use freely while collaborating with students"
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<slot />

<PageSignupCTA
  header="Scale Your Bootcamp Today with ClassroomIO"
  subText="ClassroomIO gives small and medium bootcamps the power of online learning, simplified."
  btnLabel="Sign me up"
  link="/signup"
  demo={false}
/>
