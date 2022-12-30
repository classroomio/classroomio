<script>
  import { set, get, cloneDeep } from 'lodash';
  import TextEditor from '../../../TextEditor/index.svelte';

  export let course;
</script>

<div class="h-2/5">
  <TextEditor
    content={get(course, 'metadata.goals')}
    onChange={(html) => {
      const _course = cloneDeep(course);
      set(_course, 'metadata.goals', html);
      course = _course;
    }}
  />
</div>
