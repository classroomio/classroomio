<script>
  import { marked } from 'marked';
  import RoleBasedSecurity from '../RoleBasedSecurity/index.svelte';
  import PageNav from '../PageNav/index.svelte';
  import MODES from '$lib/utils/constants/mode';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '../PageBody/index.svelte';
  import EditContent from '../EditContent/index.svelte';
  import { course } from './store';
  import { updateCourse } from '$lib/utils/services/courses';

  let mode = MODES.view;
  let isDirty = false;

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

<PageNav title="Overview" disableSticky={true}>
  <svelte:fragment slot="widget">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <div class="flex items-center">
        <PrimaryButton
          className="mr-2"
          label={mode === MODES.edit ? 'Save' : 'Edit'}
          onClick={handleModeChange}
        />
      </div>
    </RoleBasedSecurity>
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
