<script lang="ts">
  import { Button } from '../../base/button';

  interface Props {
    canGoBack?: boolean;
    canGoNext?: boolean;
    isLast?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    finishLabel?: string;
    onPrevious?: () => void;
    onNext?: () => void;
  }

  let {
    canGoBack = true,
    canGoNext = true,
    isLast = false,
    previousLabel = '',
    nextLabel = '',
    finishLabel = '',
    onPrevious = () => {},
    onNext = () => {}
  }: Props = $props();
</script>

<div class="flex justify-end gap-3">
  <Button type="button" variant="outline" size="sm" onclick={onPrevious} disabled={!canGoBack}>
    {previousLabel}
  </Button>
  <Button type="button" onclick={onNext} size="sm" disabled={!canGoNext}>
    {isLast ? finishLabel : nextLabel}
  </Button>
</div>
