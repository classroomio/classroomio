<script>
  import { Button } from '@cio/ui/base/button';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { Empty } from '@cio/ui/custom/empty';
</script>

<div class="flex h-screen w-screen flex-col items-center justify-center">
  <Empty
    title="Restricted Page"
    description="This organization is restricted. In the mean time, you can checkout our features."
    icon={LockIcon}
    variant="page"
    layout="full-page"
    showLogo={true}
  >
    <Button href="https://classroomio.com">Go Home</Button>
  </Empty>
</div>
