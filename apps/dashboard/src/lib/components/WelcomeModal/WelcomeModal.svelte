<script>
  import Modal from '../Modal/index.svelte';
  import { writable } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { welcomeModalStore } from './store';
  import { goto } from '$app/navigation';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  const closeModal = () => {
    $welcomeModalStore.open = false;
    goto($currentOrgPath + '/courses?create=true');
  };
</script>

<Modal
  onClose={closeModal}
  bind:open={$welcomeModalStore.open}
  width="w-9/12"
  modalHeading="Welcome"
>
  <p class="text-black dark:text-white text-sm md:text-base lg:text-lg">
    {$t('welcome_modal.we_at')}
    <a href="https://app.classroomio.com/" class="text-primary-700 no-underline hover:no-underline"
      >ClassroomIO</a
    >
    {$t('welcome_modal.content_1')}
    <span class="text-primary-700">{$t('welcome_modal.content_2')};</span>
    {$t('welcome_modal.content_3')}
  </p>
  <img src="/images/welcome-img.svg" alt="A welcome banner" class="w-full my-6" />
</Modal>
