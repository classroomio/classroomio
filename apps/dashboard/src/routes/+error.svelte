<script>
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import HeartCrack from '@lucide/svelte/icons/heart-crack';

  const isNotFound = $derived(page.status === 404);

  console.error('error message', page.error?.message);
</script>

<svelte:head>
  <title>{isNotFound ? 'Page not found' : 'Something unexpected occurred'}</title>
</svelte:head>

{#if isNotFound}
  <Empty
    title="Page not found"
    description="The page you're looking for doesn't exist or you don't have permission to view it."
    icon={HeartCrack}
    variant="page"
    layout="full-page"
    showLogo={true}
  >
    <div class="flex gap-2">
      <Button href="/">Go Home</Button>
    </div>
  </Empty>
{:else}
  <Empty
    title="Something unexpected occurred."
    description="Don't worry, your learning is safe. It isn't your fault, it is ours. We have gotten the error notification and will push a fix ASAP. In the meantime, take a short break and come back a bit later."
    icon={HeartCrack}
    variant="page"
    layout="full-page"
    showLogo={true}
  >
    <div class="flex gap-2">
      <Button href="https://classroomio.com/tools" variant="secondary">Try Free tools</Button>
      <Button href="/">Go Home</Button>
    </div>
  </Empty>
{/if}
