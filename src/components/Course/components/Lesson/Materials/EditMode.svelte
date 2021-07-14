<script>
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import EditContent from '../../../../EditContent/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
  import { lesson } from '../store/lessons';
</script>

<Tabs class="flex justify-center" type="container">
  <Tab label="Note" />
  <Tab label="Slide" />
  <Tab label="Video" />

  <div slot="content">
    <TabContent>
      <EditContent
        writeLabel="Note"
        bind:value={$lesson.materials.note}
        placeholder="Start typing your lesson"
      />
    </TabContent>
    <TabContent>
      <TextField label="Slide link" bind:value={$lesson.materials.slide} />
    </TabContent>
    <TabContent>
      <TextField label="Youtube link" bind:value={$lesson.materials.video} />
    </TabContent>
  </div>
</Tabs>
