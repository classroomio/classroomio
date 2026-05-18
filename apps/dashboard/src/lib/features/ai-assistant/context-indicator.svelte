<script lang="ts">
  import { CircularProgress } from '@cio/ui/custom/circular-progress';
  import { Tooltip, Provider, Trigger, Content } from '@cio/ui/base/tooltip';
  import { t } from '$lib/utils/functions/translations';
  import { formatTokenCount, type ContextUsage } from './utils/context-utils';

  interface Props {
    contextUsage: ContextUsage;
  }

  let { contextUsage }: Props = $props();

  const progressClass = $derived(
    contextUsage.isFull ? 'ui:stroke-destructive' : contextUsage.isNearlyFull ? 'stroke-amber-500' : 'ui:stroke-primary'
  );

  const tooltipText = $derived(
    t.get('ai_assistant.context_usage_tooltip', {
      used: formatTokenCount(contextUsage.usedTokens),
      max: formatTokenCount(contextUsage.maxTokens)
    })
  );
</script>

<Provider>
  <Tooltip>
    <Trigger>
      <button
        type="button"
        class="ui:text-muted-foreground hover:ui:bg-muted flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors"
      >
        <CircularProgress
          value={contextUsage.percentage}
          size={16}
          strokeWidth={2}
          {progressClass}
          trackClass="ui:stroke-muted"
        />
        <span>{contextUsage.percentage}%</span>
      </button>
    </Trigger>
    <Content side="top">
      <p class="text-xs">{tooltipText}</p>
    </Content>
  </Tooltip>
</Provider>
