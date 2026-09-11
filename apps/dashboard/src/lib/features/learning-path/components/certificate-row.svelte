<script lang="ts">
  import AwardIcon from '@lucide/svelte/icons/award';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseCount: number;
    certificateHref: string;
  }

  let { courseCount, certificateHref }: Props = $props();
</script>

<div class="border-border bg-card/50 flex items-center gap-3 rounded-lg border border-dashed p-3.5 transition">
  <span class="size-4" aria-hidden="true"></span>

  <div class="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
    <AwardIcon class="size-4" />
  </div>

  <div class="min-w-0 flex-1">
    <h3 class="text-foreground text-sm font-semibold tracking-tight">
      {$t('learningPath.builder.certificate_title')}
    </h3>
    <p class="text-muted-foreground mt-0.5 text-xs">
      Awarded automatically when a student completes all {courseCount}
      {courseCount === 1 ? 'course' : 'courses'}.
    </p>
  </div>

  <Button
    href={certificateHref}
    variant="secondary"
    size="icon"
    class="text-muted-foreground hover:text-foreground size-8"
    title={$t('learningPath.builder.configure_certificate')}
    aria-label={$t('learningPath.builder.configure_certificate')}
  >
    <SettingsIcon class="size-3.5" />
  </Button>
</div>
