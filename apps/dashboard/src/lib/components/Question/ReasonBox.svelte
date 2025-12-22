<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';

  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    reason?: string;
    isLoading?: boolean;
    rejectGrade?: any;
    acceptGrade?: any;
  }

  let { reason = '', isLoading = false, rejectGrade = () => {}, acceptGrade = () => {} }: Props = $props();
</script>

<div class="rounded-md border">
  {#if isLoading}
    <div class="flex w-full px-2 py-4">
      <div class="flex w-full flex-row items-start space-x-4">
        <img src="/ai.svg" alt="alt" class="animate-pulse" />
        <div class="w-full">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
        </div>
      </div>
      <div class="flex space-x-2">
        <Skeleton class="h-4 w-20" />
      </div>
    </div>
  {:else}
    <div class="flex items-start justify-between px-2 py-4">
      <div class="flex items-center space-x-4">
        <img src="/ai.svg" alt="alt" />
        <p class="text-sm font-normal">
          {reason}
        </p>
      </div>
      <div class="flex space-x-2">
        <Button onclick={acceptGrade}>
          {$t('course.navItem.submissions.grading_modal.accept_grade')}
        </Button>
        <Button variant="destructive" onclick={rejectGrade}>
          {$t('course.navItem.submissions.grading_modal.reject_grade')}
        </Button>
      </div>
    </div>
  {/if}
</div>
