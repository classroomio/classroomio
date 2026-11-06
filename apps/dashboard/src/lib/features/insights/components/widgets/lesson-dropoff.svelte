<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { dropoffTone, toHbarItems } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  const items = $derived(toHbarItems(result, 'lesson', $t).map((item) => ({ ...item, tone: dropoffTone(item.value) })));
</script>

<HbarList {items} />
