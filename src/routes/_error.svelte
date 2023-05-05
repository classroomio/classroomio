<script>
  export let status;
  export let error;

  // const dev = process.env.NODE_ENV === 'development';
  let errorContent;

  // function report() {}

  $: {
    try {
      errorContent = !!error ? JSON.stringify(error) : '';
    } catch (error) {}
  }
</script>

<svelte:head>
  <title>{status}</title>
  <link
    rel="stylesheet"
    href="https://unpkg.com/carbon-components-svelte/css/g90.css"
  />
</svelte:head>

<div class="w-3/5 h-3/5 m-auto flex flex-col items-center justify-center">
  <h1>Opps 😢</h1>
  <h2>Something wen't wrong and it's our fault.</h2>
  <p class="dark:text-white">Please screenshot this page and send to me.</p>
  <pre>
    {errorContent}
  </pre>
</div>

<!-- {#if dev && error.stack}
  <h1>{status}</h1>

  <p class="dark:text-white">{error.message}</p>
  <pre>{error.stack}</pre>
{/if} -->
<style>
  h1,
  p {
    margin: 0 auto;
  }

  pre {
    width: 500px;
    white-space: pre-wrap; /* css-3 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word;
  }

  h1 {
    font-size: 2.8em;
    font-weight: 700;
    margin: 0 0 0.5em 0;
  }

  p {
    margin: 1em auto;
  }

  @media (min-width: 480px) {
    h1 {
      font-size: 4em;
    }
  }
</style>
