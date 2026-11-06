<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import type { ZapierAccess } from '$features/automation/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    access: ZapierAccess;
    organizationName: string;
  }

  let { access, organizationName }: Props = $props();

  const T = 'automation.zapier.app_page';
  const scopeLabel = $derived(
    access === 'read_write' ? $t(`${T}.trust_scope_read_write`) : $t(`${T}.trust_scope_read_only`)
  );
</script>

<ul class="mx-auto grid max-w-[760px] gap-2.5 sm:grid-cols-3" data-testid="zapier-trust-strip">
  <li class="ui:border-border ui:bg-card flex items-start gap-2.5 rounded-xl border p-3">
    <span class="ui:bg-muted flex size-[30px] shrink-0 items-center justify-center rounded-lg">
      <LockIcon class="custom ui:text-muted-foreground size-4" />
    </span>
    <span class="ui:text-muted-foreground min-w-0 text-xs leading-[1.45]">
      <span class="ui:text-foreground block text-[13px] font-semibold">{scopeLabel}</span>
      <span class="ui:text-muted-foreground block">{$t(`${T}.trust_scope_note`, { org: organizationName })}</span>
    </span>
  </li>

  <li class="ui:border-border ui:bg-card flex items-start gap-2.5 rounded-xl border p-3">
    <span class="ui:bg-muted flex size-[30px] shrink-0 items-center justify-center rounded-lg">
      <RotateCcwIcon class="custom ui:text-muted-foreground size-4" />
    </span>
    <span class="ui:text-muted-foreground min-w-0 text-xs leading-[1.45]">
      <span class="ui:text-foreground block text-[13px] font-semibold">{$t(`${T}.trust_revoke_title`)}</span>
      <span class="ui:text-muted-foreground block">{$t(`${T}.trust_revoke_note`)}</span>
    </span>
  </li>

  <li class="ui:border-border ui:bg-card flex items-start gap-2.5 rounded-xl border p-3">
    <span class="ui:bg-muted flex size-[30px] shrink-0 items-center justify-center rounded-lg">
      <ZapIcon class="custom ui:text-muted-foreground size-4" />
    </span>
    <span class="ui:text-muted-foreground min-w-0 text-xs leading-[1.45]">
      <span class="ui:text-foreground block text-[13px] font-semibold">{$t(`${T}.trust_zapier_title`)}</span>
      <span class="ui:text-muted-foreground block">{$t(`${T}.trust_zapier_note`)}</span>
    </span>
  </li>
</ul>
