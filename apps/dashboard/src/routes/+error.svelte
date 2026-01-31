<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import HeartCrack from '@lucide/svelte/icons/heart-crack';

  if (page.status == 404 && browser) {
    goto('/404');
  }

  // TODO: Add error tracking here
  console.error('error message', page.error?.message);
</script>

<svelte:head>
  <title>Something unexpected occured</title>
</svelte:head>

<Empty
  title="Something unexpected occured."
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
