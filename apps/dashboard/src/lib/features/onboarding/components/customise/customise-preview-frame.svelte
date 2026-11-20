<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    address: string;
    children: Snippet;
  }

  let { address, children }: Props = $props();
</script>

<div
  class="ui:border-border ui:bg-card overflow-hidden rounded-[18px] border"
  data-testid="onboarding-customise-preview"
>
  <div class="ui:border-border ui:bg-muted flex h-[50px] items-center gap-[7px] border-b px-3.5">
    <span class="ui:bg-border size-[11px] shrink-0 rounded-full"></span>
    <span class="ui:bg-border size-[11px] shrink-0 rounded-full"></span>
    <span class="ui:bg-border size-[11px] shrink-0 rounded-full"></span>
    <span
      class="ui:border-border ui:bg-card ui:text-muted-foreground ui:font-brand-mono ml-3.5 h-[22px] min-w-0 flex-[0_1_360px] truncate rounded-md border px-2.5 text-left text-[11px] leading-5"
    >
      {address}
    </span>
  </div>

  <div role="img" aria-label={$t('onboarding.v2.customise.preview_frame_label')}>
    <div class="pointer-events-none relative [contain:layout_paint]" inert>
      {@render children()}
    </div>
  </div>
</div>
