<script>
  import { onMount, onDestroy } from 'svelte';
  import Tabs from '../../../../Tabs/index.svelte';
  import TabContent from '../../../../TabContent/index.svelte';
  import EditContent from '../../../../EditContent/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
  import {
    lesson,
    handleUpdateLessonMaterials,
    isLessonDirty,
  } from '../store/lessons';

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

  onMount(() => {
    isLessonDirty.set(false);
  });

  onDestroy(() => {
    if (!$isLessonDirty) {
      return;
    }
    handleUpdateLessonMaterials($lesson);
  });

  $: console.log(`isLessonDirty`, $isLessonDirty);
</script>

<Tabs {tabs} {currentTab} {onChange}>
  <slot:fragment slot="content">
    <TabContent value={tabs[0].value} index={currentTab}>
      <EditContent
        writeLabel="Note"
        bind:value={$lesson.materials.note}
        placeholder="Start typing your lesson"
        onInputChange={() => ($isLessonDirty = true)}
      />
    </TabContent>
    <TabContent value={tabs[1].value} index={currentTab}>
      <TextField
        label="Slide link"
        bind:value={$lesson.materials.slide_url}
        onChange={() => ($isLessonDirty = true)}
      />
    </TabContent>
    <TabContent value={tabs[2].value} index={currentTab}>
      <TextField
        label="Youtube link"
        bind:value={$lesson.materials.video_url}
        onChange={() => ($isLessonDirty = true)}
      />
    </TabContent>
  </slot:fragment>
</Tabs>
