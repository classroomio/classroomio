<script>
  import PageNav from '../PageNav/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '../PageBody/index.svelte';
  import { course } from './store';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import AnoucementCard from './components/AnoucementCard.svelte';
  import { Dropdown } from 'carbon-components-svelte';
  import LogoYoutube from 'carbon-icons-svelte/lib/LogoYoutube.svelte';
  import Repeat from 'carbon-icons-svelte/lib/Repeat.svelte';
  import { Link } from 'carbon-icons-svelte';
  import Upload from 'carbon-icons-svelte/lib/Upload.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { getTextFromHTML } from '$lib/utils/functions/course';

  let anouncement = false;

  const emojipicker = [
    { name: 'smile', icon: '😀', count: 0 },
    { name: 'thumbsup', icon: '👍', count: 0 },
    { name: 'thumbsdown', icon: '👎', count: 0 },
    { name: 'clap', icon: '👏', count: 0 }
  ];

  let mockAnouncements = [
    {
      id: 1,
      image:
        'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
      content: 'this is a demo anounceent made to show tell you what is happening',
      name: 'Best Emmanuel Ibitoye-Rotimi',
      emoji: emojipicker
    },
    {
      id: 2,
      image:
        'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
      content: 'this is a demo anounceent made to show tell you what is happening',
      name: 'Best Emmanuel Ibitoye-Rotimi',
      emoji: emojipicker
    },
    {
      id: 3,
      image:
        'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
      content: 'this is a demo anounceent made to show tell you what is happening',
      name: 'Best Emmanuel Ibitoye-Rotimi',
      emoji: emojipicker
    }
  ];

  let newAnouncement = {
    id: mockAnouncements.length + 1,
    image:
      'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
    content: '',
    name: 'Best Emmanuel Ibitoye-Rotimi',
    emoji: emojipicker
  };
  const reusePost = () => {};

  const post = () => {
    mockAnouncements = [newAnouncement, ...mockAnouncements];
  };
</script>

<PageNav title="Anouncements" disableSticky={true} />

<PageBody width="max-w-4xl px-3">
  {#if !anouncement}
    <button
      class="flex items-center justify-between border-gray-200 bg-gray-50 p-3 w-full h-20 rounded-md my-2 shadow-md"
      on:click={() => (anouncement = true)}
    >
      <div class="flex gap-2">
        <span class="w-7 h-7">
          <img
            src={$course.logo}
            alt="users banner"
            class="w-full h-full rounded-full object-cover"
          />
        </span>
        <button class="flex-1" on:click={() => (anouncement = true)}>
          <p class="text-gray-400 hover:text-gray-500">Anounce something to your class</p>
        </button>
      </div>
      <IconButton
        onClick={reusePost}
        toolTipProps={{ title: 'Reuse Post', hotkeys: [], direction: 'bottom' }}
      >
        <Repeat size={24} />
      </IconButton>
    </button>
  {:else}
    <section class="flex flex-col border-2 rounded-xl p-3">
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
          <PrimaryButton label="Cancel" onClick={() => (anouncement = false)} />
          <PrimaryButton label="Post" onClick={post} />
        </div>
      </div>
    </section>
  {/if}
  {#each mockAnouncements as info}
    <AnoucementCard value={info} />
  {/each}
</PageBody>
