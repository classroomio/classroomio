<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    checked: boolean;
    disabled?: boolean;
    onToggle: (nextChecked: boolean) => void;
  }

  let { checked = true, disabled = false, onToggle }: Props = $props();
</script>

<div class="ui:border-border ui:bg-card mb-5 flex items-center justify-between rounded-lg border p-4">
  <div class="flex items-center gap-3">
    <div class="ui:bg-primary/10 ui:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
      <LockIcon class="size-4.5" />
    </div>
    <div class="space-y-0.5">
      <p class="text-foreground text-sm font-medium">
        {$t('learningPath.builder.unlock_rule_title')}
      </p>
      <p class="text-muted-foreground text-xs">
        {$t('learningPath.builder.unlock_rule_desc')}
      </p>
    </div>
  </div>

  <Switch {checked} {disabled} onCheckedChange={onToggle} aria-label={$t('learningPath.builder.unlock_rule_title')} />
</div>
