<script>
  import marked from 'marked';
  import PageNav from '../PageNav/index.svelte';
  import MODES from '../../utils/constants/mode';
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import PageBody from '../PageBody/index.svelte';
  import EditContent from '../EditContent/index.svelte';
  import { course } from '../Course/store';
  import { updateCourse } from '../../utils/services/courses';

  let mode = MODES.view;
  let isDirty = false;

  async function handleModeChange() {
    if (mode === MODES.edit) {
      mode = MODES.view;
      if (isDirty) {
        const { overview, id } = $course;
        const { data, error } = await updateCourse(id, { overview });
        console.log(`data`, data);
        console.log(`error`, error);
      }
    } else {
      mode = MODES.edit;
    }
  }
</script>

<PageNav title="Overview" disableSticky={true}>
  <svelte:fragment slot="widget">
    <div class="flex items-center">
      <PrimaryButton
        className="mr-2"
        label={mode === MODES.edit ? 'Save' : 'Edit'}
        onClick={handleModeChange}
      />
    </div>
  </svelte:fragment>
</PageNav>

<PageBody width="max-w-3xl px-3">
  {#if mode === MODES.edit}
    <EditContent
      writeLabel="Note"
      bind:value={$course.overview}
      placeholder="Start typing your lesson"
      onInputChange={() => {
        isDirty = true;
        console.log('input change');
      }}
    />
  {:else}
    <article class="preview prose prose-sm sm:prose p-2">
      {@html marked($course.overview || '')}
    </article>
  {/if}
</PageBody>
