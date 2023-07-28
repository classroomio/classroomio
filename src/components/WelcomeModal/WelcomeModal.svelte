<script>
  import Modal from '../Modal/index.svelte';
  import { writable } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import { welcomeModalStore } from './store';

  const closeModal = () => {
    $welcomeModalStore.open = false;
  };
</script>

<Modal
  onClose={closeModal}
  bind:open={$welcomeModalStore.open}
  width="w-9/12"
  modalHeading="Welcome"
>
  <p class="text-black text-sm md:text-base lg:text-lg">
    We at <a
      href="https://app.classroomio.com/"
      class="text-blue-700 no-underline hover:no-underline">ClassroomIO</a
    >
    are a small team with a large mission to empower educators with great
    technology to help them train the future generation. Education is the most
    powerful gift you can give anyone, and it makes so much sense to give you
    all the tools you need to give more people this GIFT.
    <span class="text-blue-700">Thank you for choosing us;</span> we deeply appreciate
    it and are at your service.
  </p>
  <img
    src="/images/welcome-modal-banner.svg"
    alt="A welcome banner"
    class="w-full my-6"
  />
</Modal>
