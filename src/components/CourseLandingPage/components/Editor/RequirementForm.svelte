<script>
  import { set, get, cloneDeep } from 'lodash';
  import TextEditor from '../../../TextEditor/index.svelte';

  export let course;
</script>

<div class="h-2/5">
  <TextEditor
    content={get(course, 'metadata.requirements')}
    onChange={(html) => {
      const _course = cloneDeep(course);
      set(_course, 'metadata.requirements', html);
      course = _course;
    }}
  />
</div>
