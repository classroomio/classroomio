<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';
  import { classroomio } from '$lib/utils/services/api';
  import { courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  let isActivating = $state(false);

  const activate = async () => {
    if (!courseApi.course?.id) return;

    isActivating = true;

    try {
      const response = await classroomio.course[':courseId']['convert-v2'].$post({
        param: { courseId: courseApi.course.id }
      });

      const result = await response.json();

      if (result.success) {
        window.location.reload();
      } else {
        snackbar.error('snackbar.something');
      }
    } catch (error) {
      console.error('Error converting course to V2:', error);
      snackbar.error('snackbar.something');
    } finally {
      isActivating = false;
    }
  };

  function handleClose() {
    open = false;
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) handleClose();
  }}
>
  <Dialog.Content class="w-[80%] max-w-xl md:w-[65%]">
    <Dialog.Header>
      <Dialog.Title>{$t(`course.navItem.lessons.section_prompt.header`)}</Dialog.Title>
    </Dialog.Header>
    <div class="flex w-full flex-col items-center">
      <div class="mb-8">
        <h3 class="text-center text-2xl">
          {$t('course.navItem.lessons.section_prompt.title')}
        </h3>
        <p class="max-w-md text-center">
          {$t('course.navItem.lessons.section_prompt.description')}
        </p>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" onclick={handleClose}>
          {$t('course.navItem.lessons.section_prompt.cancel')}
        </Button>
        <Button onclick={activate} loading={isActivating}>
          {$t('course.navItem.lessons.section_prompt.activate')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
