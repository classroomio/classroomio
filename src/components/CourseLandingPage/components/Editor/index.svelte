<script>
  import ChevronRight24 from 'carbon-icons-svelte/lib/ChevronRight24';
  import Container from './Container.svelte';
  import Expandable from '../../../Expandable/index.svelte';

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';

  const sections = [
    {
      title: 'Header',
    },
    {
      title: 'Requirement',
    },
    {
      title: 'Description',
    },
    {
      title: 'Syllabus',
    },
    {
      title: 'About Us',
    },
  ];
</script>

<Container>
  <h3 class="bg-white {borderBottomGrey} p-2">Builder</h3>

  {#each sections as section}
    <button
      class="flex items-center justify-between p-2 w-full bg-white border border-b-0 border-gray-300"
    >
      <p class="mr-2">{section.title} section</p>
      <ChevronRight24 class="carbon-class" />
    </button>
  {/each}
</Container>
