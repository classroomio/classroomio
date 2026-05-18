<script>
  import { PageSignupCTA } from '$lib/components';
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

<svelte:head>
  <title>Free Tools | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
  <meta property="og:title" content="ClassroomIO Free Tools" />
  <meta
    property="og:description"
    content="At ClassroomIO, we have built a suit of tools for anyone to use freely while collaborating with students"
  />

  <meta property="og:image:secure_url" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />

  <meta name="twitter:title" content="ClassroomIO Free Tools" />
  <meta
    name="twitter:description"
    content="At ClassroomIO, we have built a suit of tools for anyone to use freely while collaborating with students"
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

{@render children?.()}

<PageSignupCTA
  header="Stop forwarding help articles."
  subText="Launch a branded academy on your domain in days."
  btnLabel="Book a Demo"
/>
