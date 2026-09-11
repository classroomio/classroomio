<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { Switch } from '@cio/ui/base/switch';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    checked: boolean;
    onToggle: (nextChecked: boolean) => void;
  }

  let { checked = true, onToggle }: Props = $props();
</script>

<Card.Root class="border-border bg-card mb-5 flex items-center gap-3.5 border p-4">
  <div class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
    <LockIcon class="size-4.5" />
  </div>

  <div class="min-w-0 flex-1">
    <div class="text-foreground text-sm font-semibold">
      {$t('learningPath.builder.unlock_rule_title')}
    </div>
    <p class="text-muted-foreground text-xs">
      {$t('learningPath.builder.unlock_rule_desc')}
    </p>
  </div>

  <Switch {checked} onCheckedChange={onToggle} aria-label={$t('learningPath.builder.unlock_rule_title')} />
</Card.Root>
