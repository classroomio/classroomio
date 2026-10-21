<script lang="ts">
  import { RadioIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import type { SessionIndicatorPhase } from '$features/course/utils/live-session-phase';

  interface Props {
    phase: SessionIndicatorPhase;
    size?: number;
  }

  let { phase, size = 14 }: Props = $props();

  const isLive = $derived(phase === 'live');
  const label = $derived(
    isLive ? $t('course.navItem.lessons.session.live_now') : $t('course.navItem.lessons.session.live_indicator')
  );
</script>

<span class="flex shrink-0 items-center {isLive ? '' : 'ui:text-muted-foreground'}" title={label} aria-label={label}>
  <RadioIcon {size} color={isLive ? '#ef4444' : 'currentColor'} />
</span>
