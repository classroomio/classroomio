<script>
  // @ts-nocheck

  import Modal from '$lib/components/Modal/index.svelte';
  import { isNewAnouncementModal } from '$lib/components/Course/components/Anouncements/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { Dropdown } from 'carbon-components-svelte';
  import LogoYoutube from 'carbon-icons-svelte/lib/LogoYoutube.svelte';
  import { Link } from 'carbon-icons-svelte';
  import Upload from 'carbon-icons-svelte/lib/Upload.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { getTextFromHTML } from '$lib/utils/functions/course';
  import { createAnnouncement } from '$lib/utils/services/announcement';

  export let mockAnouncements = [];

  export let generateUniqueId = () => {};
  export let getCurrentTime = () => {};
  export let getEmojiPicker = () => {};

  let newAnouncement = {};
  const onPost = async () => {
    if (newAnouncement.content !== '') {
      mockAnouncements = [
        {
          id: generateUniqueId(),
          image:
            'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
          content: newAnouncement.content,
          author: 'Best Emmanuel Ibitoye-Rotimi',
          created_at: getCurrentTime(),
          comments: [],
          emoji: getEmojiPicker()
        },
        ...mockAnouncements
      ];

      try {
        const data = await createAnnouncement({
          image:
            'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
          content: newAnouncement.content,
          author: 'Best Emmanuel Ibitoye-Rotimi',
          created_at: getCurrentTime(),
          // comments: [],
          emoji: getEmojiPicker()
        });

        if (data) {
          console.log('onPost', data);
        }
      } catch (error) {
        console.log(error);
      }

      newAnouncement.content = '';
      $isNewAnouncementModal.open = false;
    }
  };
  const resetEditor = () => {
    newAnouncement.content = '';
    $isNewAnouncementModal.open = false;
  };
</script>

<Modal
  onClose={resetEditor}
  bind:open={$isNewAnouncementModal.open}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading="Make An Anouncement"
>
  <section class="flex flex-col border-2 rounded-xl p-3 h-full">
    <div class="mb-3">
      <p class="mb-3 text-base font-medium">For</p>
      <section class="flex items-start justify-start gap-2">
        <Dropdown
          selectedId="0"
          class="h-10"
          items={[
            { id: '0', text: 'Authors' },
            { id: '1', text: 'Tutors' }
          ]}
        />
        <Dropdown
          selectedId="0"
          class="h-10"
          items={[
            { id: '0', text: 'Students' },
            { id: '1', text: 'Visitors' },
            { id: '2', text: 'Public' }
          ]}
        />
      </section>
    </div>
    <TextEditor
      value={newAnouncement.content}
      onChange={(text) => {
        newAnouncement.content = getTextFromHTML(text);
      }}
      placeholder="Make an anouncement to your students"
      maxHeight={200}
    />
    <div class="flex items-center justify-between py-2">
      <div class="flex gap-2">
        <IconButton contained={true}>
          <LogoYoutube size={20} />
        </IconButton>
        <IconButton contained={true}>
          <Link size={20} />
        </IconButton>
        <IconButton contained={true}>
          <Upload size={20} />
        </IconButton>
      </div>
      <div class="flex gap-2">
        <PrimaryButton
          label="Cancel"
          variant={VARIANTS.OUTLINED}
          onClick={() => ($isNewAnouncementModal.open = false)}
        />
        <PrimaryButton label="Post" onClick={onPost} />
      </div>
    </div>
  </section>
</Modal>
