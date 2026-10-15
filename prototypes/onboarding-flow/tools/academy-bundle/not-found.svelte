<script lang="ts">
  /* routes/+error.svelte, the 404 branch, as an org-site visitor sees it */
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { HomeIcon, HoverableItem } from '@cio/ui/custom/moving-icons';
  import HeartCrack from '@lucide/svelte/icons/heart-crack';

  interface Props {
    homeHref: string;
    continueHref: string;
  }

  let { homeHref, continueHref }: Props = $props();
</script>

<Empty
  title="Page not found"
  description="The page you're looking for doesn't exist or you don't have permission to view it."
  icon={HeartCrack}
  variant="page"
  layout="full-page"
  showLogo={true}
>
  <div class="flex items-center gap-2">
    <Button variant="link" href={continueHref}>Continue Learning</Button>
    <HoverableItem>
      {#snippet children(isHovered)}
        <Button href={homeHref}>
          <HomeIcon {isHovered} size={16} ariaHidden={true} />
          Go Home
        </Button>
      {/snippet}
    </HoverableItem>
  </div>
</Empty>
