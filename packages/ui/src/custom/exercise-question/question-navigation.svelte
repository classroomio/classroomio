<script lang="ts">
  import { Button } from '../../base/button';

  interface Props {
    canGoBack?: boolean;
    canGoNext?: boolean;
    isLast?: boolean;
    isSubmitting?: boolean;
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
    isSubmitting = false,
    previousLabel = '',
    nextLabel = '',
    finishLabel = '',
    onPrevious = () => {},
    onNext = () => {}
  }: Props = $props();
</script>

<div class="flex justify-end gap-3">
  <Button type="button" variant="outline" size="sm" onclick={() => onPrevious()} disabled={!canGoBack || isSubmitting}>
    {previousLabel}
  </Button>
  <Button
    type="button"
    onclick={() => onNext()}
    size="sm"
    disabled={!canGoNext || isSubmitting}
    loading={isLast && isSubmitting}
  >
    {isLast ? finishLabel : nextLabel}
  </Button>
</div>
