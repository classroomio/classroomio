<script>
  import Modal from '../Modal/index.svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentOrgPath } from '$lib/utils/store/org';
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { profile } from '$lib/utils/store/user';

  let open = false;

  const closeModal = () => {
    triggerSendEmail(NOTIFICATION_NAME.WELCOME_TO_APP, {
      to: $profile.email,
      name: $profile.fullname
    });

    goto($currentOrgPath + '/setup');
  };

  $: {
    const query = new URLSearchParams($page.url.search);
    open = query.get('welcomePopup') === 'true';
  }
</script>

<Modal onClose={closeModal} {open} width="w-9/12" maxWidth="w-[800px]" modalHeading="Welcome">
  <p class="text-black dark:text-white text-sm md:text-base lg:text-lg">
    We at <a
      href="https://app.classroomio.com/"
      class="text-primary-700 no-underline hover:no-underline">ClassroomIO</a
    >
    are a small team with a large mission to empower educators with great technology to help them train
    the future generation. Education is the most powerful gift you can give anyone, and it makes so much
    sense to give you all the tools you need to give more people this GIFT.
    <span class="text-primary-700">Thank you for choosing us;</span> we deeply appreciate it and are
    at your service.
  </p>
  <img src="/images/welcome-img.svg" alt="A welcome banner" class="w-full my-6" />
</Modal>
