<script>
  import Tabs from '../../../../Tabs/index.svelte';
  import TabContent from '../../../../TabContent/index.svelte';
  import MarkdownRender from '../../../../MarkdownRender/index.svelte';
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
      <MarkdownRender content={$lesson.materials.note} />
    </TabContent>
    <TabContent value={tabs[1].value} index={currentTab}>
      <iframe
        title="Embeded Slides"
        src={$lesson.materials.slide}
        frameborder="0"
        width="100%"
        height="569"
        allowfullscreen="true"
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
      />
    </TabContent>
    <TabContent value={tabs[2].value} index={currentTab}>
      <iframe
        width="100%"
        height="569"
        src={$lesson.materials.video}
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </TabContent>
  </slot:fragment>
</Tabs>
