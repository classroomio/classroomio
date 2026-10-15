<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import GitBranchIcon from '@lucide/svelte/icons/git-branch';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    pathName?: string;
  }

  let { pathName = '' }: Props = $props();
</script>

<div class="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center p-6">
  <Empty
    title={$t('learningPath.hub.placeholder_title')}
    description={pathName
      ? `${pathName} — ${$t('learningPath.hub.placeholder_description')}`
      : $t('learningPath.hub.placeholder_description')}
    icon={GitBranchIcon}
    variant="page"
  >
    <div class="mt-4 flex justify-center">
      <Button href="/lms/mylearning" variant="outline">
        {$t('common.back_to_my_learning')}
      </Button>
    </div>
  </Empty>
</div>
