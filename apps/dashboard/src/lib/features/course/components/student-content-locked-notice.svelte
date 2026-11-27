<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { Empty } from '@cio/ui/custom/empty';
  import { ContentType } from '@cio/utils/constants/content';
  import { t } from '$lib/utils/functions/translations';
  import type { StudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import {
    getStudentContentLockDescription,
    getStudentContentLockTitleKey
  } from '$features/course/utils/content-lock-utils';

  interface Props {
    reason: StudentContentLockReason;
    contentType: typeof ContentType.Lesson | typeof ContentType.Exercise;
    blockingItemTitle?: string | null;
  }

  let { reason, contentType, blockingItemTitle = null }: Props = $props();

  const titleKey = $derived(getStudentContentLockTitleKey(reason));
  const description = $derived(getStudentContentLockDescription(reason, contentType, blockingItemTitle));
</script>

<Empty
  title={$t(titleKey)}
  description={$t(description.key, description.values)}
  icon={LockIcon}
  variant="page"
  class="text-center"
/>
