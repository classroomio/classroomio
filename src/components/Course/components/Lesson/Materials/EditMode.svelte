<script>
  import Tabs from '../../../../Tabs/index.svelte';
  import TabContent from '../../../../TabContent/index.svelte';
  import EditContent from '../../../../EditContent/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
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
    console.log(`$lesson`, $lesson);
    return () => {
      currentTab = tabValue;
    };
  }
</script>

<Tabs {tabs} {currentTab} {onChange}>
  <slot:fragment slot="content">
    <TabContent value={tabs[0].value} index={currentTab}>
      <EditContent
        writeLabel="Note"
        bind:value={$lesson.materials.note}
        placeholder="Start typing your lesson"
      />
    </TabContent>
    <TabContent value={tabs[1].value} index={currentTab}>
      <TextField label="Slide link" bind:value={$lesson.materials.slide} />
    </TabContent>
    <TabContent value={tabs[2].value} index={currentTab}>
      <TextField label="Youtube link" bind:value={$lesson.materials.video} />
    </TabContent>
  </slot:fragment>
</Tabs>
