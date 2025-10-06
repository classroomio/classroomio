<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { supabase } from '$lib/utils/functions/supabase';
  import { course } from '../../store';
  import { snackbar } from '$lib/components/Snackbar/store';

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

<Modal
  onClose={handleClose}
  bind:open
  width="w-[80%] md:w-[65%]"
  maxWidth="max-w-xl"
  modalHeading={$t(`course.navItem.lessons.section_prompt.header`)}
>
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
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        label={$t('course.navItem.lessons.section_prompt.cancel')}
        onClick={handleClose}
      />
      <PrimaryButton
        label={$t('course.navItem.lessons.section_prompt.activate')}
        onClick={activate}
        isLoading={isActivating}
      />
    </div>
  </div>
</Modal>
