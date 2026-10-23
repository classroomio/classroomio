<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    passMark: number;
  }

  let { passMark }: Props = $props();
</script>

<span class="ui:bg-primary/10 ui:text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
  {$t('insights.pass_required_tag', { mark: passMark })}
</span>
