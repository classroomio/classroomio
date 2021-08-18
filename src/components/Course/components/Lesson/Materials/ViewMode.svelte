<script>
  import Tabs from '../../../../Tabs/index.svelte';
  import TabContent from '../../../../TabContent/index.svelte';
  import MarkdownRender from '../../../../MarkdownRender/index.svelte';
  import Box from '../../../../Box/index.svelte';
  import { lesson } from '../store/lessons';

  const tabs = [
    {
      label: 'Note',
      value: 1,
    },
    {
      label: 'Slide',
      value: 2,
    },
    {
      label: 'Video',
      value: 3,
    },
  ];
  let currentTab = tabs[0].value;

  function onChange(tabValue) {
    return () => {
      currentTab = tabValue;
    };
  }
</script>

<Tabs {tabs} {currentTab} {onChange}>
  <slot:fragment slot="content">
    <TabContent value={tabs[0].value} index={currentTab}>
      {#if $lesson.materials.note}
        <MarkdownRender content={$lesson.materials.note} />
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500">No note added</h3>
          <img alt="Video not found" src="/notfound.webp" class="w-80" />
        </Box>
      {/if}
    </TabContent>
    <TabContent value={tabs[1].value} index={currentTab}>
      {#if $lesson.materials.slide_url}
        <iframe
          title="Embeded Slides"
          src={$lesson.materials.slide_url}
          frameborder="0"
          width="100%"
          height="569"
          allowfullscreen="true"
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
        />
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500">No slide added</h3>
          <img alt="Video not found" src="/notfound.webp" class="w-80" />
        </Box>
      {/if}
    </TabContent>
    <TabContent value={tabs[2].value} index={currentTab}>
      {#if $lesson.materials.video_url}
        <iframe
          width="100%"
          height="569"
          src={$lesson.materials.video_url}
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        />
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500">No youtube video added</h3>
          <img alt="Video not found" src="/notfound.webp" class="w-80" />
        </Box>
      {/if}
    </TabContent>
  </slot:fragment>
</Tabs>
