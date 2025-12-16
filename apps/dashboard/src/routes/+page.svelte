<script>
  import { appInitApi } from '$features/app/init.svelte';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Button } from '@cio/ui/base/button';
  import FrownIcon from '@lucide/svelte/icons/frown';
  import { Empty } from '@cio/ui/custom/empty';
  import { SimpleLogoNav } from '@cio/ui/custom/simple-logo-nav';
</script>

<svelte:head>
  <title>ClassroomIO - The Coure Platform That’s Actually Easy To Use</title>
</svelte:head>

{#if appInitApi.loading || appInitApi.data}
  <div class="m-2 flex h-screen w-screen flex-col items-center justify-center font-sans sm:m-0">
    <SimpleLogoNav />
    <Spinner class="size-14! text-blue-700!" />
  </div>
{:else}
  <Empty
    title="Something Went Wrong"
    description="We encountered an unexpected error. Please reload the page or contact us for support."
    icon={FrownIcon}
    variant="page"
    layout="full-page"
    showLogo={true}
  >
    {#if appInitApi.error}
      <p class="my-2 text-red-500">{appInitApi.error}</p>
    {/if}
    <div class="flex gap-2">
      <Button variant="secondary" onclick={() => window.location.reload()}>Reload Page</Button>
      <Button variant="default" href="https://classroomio.com/contact">Contact Us</Button>
    </div>
  </Empty>
{/if}
