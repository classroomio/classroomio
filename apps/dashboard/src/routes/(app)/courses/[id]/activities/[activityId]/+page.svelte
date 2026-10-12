<script lang="ts">
  import { ActivityPage } from '$features/course/pages';
  import type { Activity } from '$features/course/utils/types';
  import * as Page from '@cio/ui/base/page';

  interface Props {
    data: {
      courseId: string;
      activityId: string;
      activity: Activity | null;
    };
  }

  let { data }: Props = $props();
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-4xl lg:max-w-5xl">
  {#key data.activityId}
    <ActivityPage courseId={data.courseId} activityId={data.activityId} />
  {/key}
</Page.Root>
