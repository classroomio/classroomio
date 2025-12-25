<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';
  import { course } from '../../store';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  let isActivating = $state(false);

  const activate = async () => {
    isActivating = true;
    const { error } = await supabase.rpc('convert_course_to_v2', {
      course_id_arg: $course.id
    });

    if (error) {
      snackbar.error('snackbar.something');
      return;
    }

    window.location.reload();
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
