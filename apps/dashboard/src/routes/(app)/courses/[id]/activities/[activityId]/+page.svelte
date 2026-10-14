<script lang="ts">
  import { ActivityPage } from '$features/course/pages';
  import { activityApi } from '$features/course/api';
  import type { Activity, ActivityEditor } from '$features/course/utils/types';
  import * as Page from '@cio/ui/base/page';

  interface Props {
    data: {
      courseId: string;
      activityId: string;
      activity: Activity | null;
      editor: ActivityEditor | null;
    };
  }

  let { data }: Props = $props();

  $effect(() => {
    if (!data.activityId) return;

    if (!data.activity) {
      if (activityApi.activity?.id === data.activityId) {
        activityApi.activity = null;
        activityApi.editor = null;
      }
      return;
    }

    if (activityApi.activity?.id === data.activity.id) return;

    activityApi.activity = data.activity;
    activityApi.editor = data.editor;
  });
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-4xl lg:max-w-5xl">
  {#key data.activityId}
    <ActivityPage courseId={data.courseId} activityId={data.activityId} />
  {/key}
</Page.Root>
