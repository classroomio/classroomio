<script>
  import RoleBasedSecurity from '../RoleBasedSecurity/index.svelte';
  import PageNav from '../PageNav/index.svelte';
  import MODES from '$lib/utils/constants/mode';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '../PageBody/index.svelte';
  import { course } from './store';
  import { updateCourse } from '$lib/utils/services/courses';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import AnoucementCard from './components/AnoucementCard.svelte';
  import { Dropdown } from 'carbon-components-svelte';
  import LogoYoutube from 'carbon-icons-svelte/lib/LogoYoutube.svelte';
  import { Link } from 'carbon-icons-svelte';
  import Upload from 'carbon-icons-svelte/lib/Upload.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  let mode = MODES.view;
  let isDirty = false;
  const mockAnouncements = [
    {
      id: 1,
      image:
        'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
      content: 'this is a demo anounceent made to show tell you what is happening',
      name: 'Best Emmanuel Ibitoye-Rotimi'
    },
    {
      id: 2,
      image:
        'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
      content: 'this is a demo anounceent made to show tell you what is happening',
      name: 'Best Emmanuel Ibitoye-Rotimi'
    },
    {
      id: 3,
      image:
        'https://www.befunky.com/images/prismic/82e0e255-17f9-41e0-85f1-210163b0ea34_hero-blur-image-3.jpg?auto=avif,webp&format=jpg&width=896',
      content: 'this is a demo anounceent made to show tell you what is happening',
      name: 'Best Emmanuel Ibitoye-Rotimi'
    }
  ];

  async function handleModeChange() {
    if (mode === MODES.edit) {
      mode = MODES.view;
      if (isDirty) {
        const { overview, id } = $course;
        await updateCourse(id, undefined, { overview });
      }
    } else {
      mode = MODES.edit;
    }
  }
</script>

<PageNav title="Anouncements" disableSticky={true} />

<PageBody width="max-w-3xl px-3">
  <section class="flex flex-col border-2 rounded-xl p-3">
    <div class="mb-3">
      <p class="mb-3 text-base font-medium">For</p>
      <section class="flex gap-2 mb-2">
        <Dropdown
          selectedId="0"
          items={[
            { id: '0', text: 'Authors' },
            { id: '1', text: 'Tutors' }
          ]}
        />
        <Dropdown
          selectedId="0"
          items={[
            { id: '0', text: 'Students' },
            { id: '1', text: 'Visitors' },
            { id: '2', text: 'Public' }
          ]}
        />
      </section>
    </div>
    <TextEditor
      onChange={(html) => {
        isDirty = true;
        $course.overview = html;
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
        <PrimaryButton label="Cancel" />
        <PrimaryButton label="Post" />
      </div>
    </div>
  </section>
  {#each mockAnouncements as info}
    <AnoucementCard value={info} />
  {/each}
  <!-- <HtmlRender className="p-2" content={$course.overview || ''} /> -->
</PageBody>
