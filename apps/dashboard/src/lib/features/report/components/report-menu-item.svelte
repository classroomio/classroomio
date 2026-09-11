<script lang="ts">
  import FlagIcon from '@lucide/svelte/icons/flag';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { t } from '$lib/utils/functions/translations';
  import { reportDialog } from '../store/report-dialog.svelte';
  import type { TContentReportTargetType } from '@cio/utils/validation/report';

  interface Props {
    targetType: TContentReportTargetType;
    targetId: string | number;
  }

  let { targetType, targetId }: Props = $props();

  function handleSelect() {
    reportDialog.start(targetType, String(targetId));
  }
</script>

<DropdownMenu.Item onSelect={handleSelect}>
  <FlagIcon class="mr-2 size-3.5" />
  <span>{$t('report.menu')}</span>
</DropdownMenu.Item>
