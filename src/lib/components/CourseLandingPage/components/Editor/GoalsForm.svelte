<script>
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import TextEditor from '$lib/components/TextEditor/index.svelte';

  export let course;

  function handleChange(html) {
    const _course = cloneDeep(course);
    set(_course, 'metadata.goals', html);
    course = _course;
  }
</script>

<div class="h-2/5">
  <TextEditor value={get(course, 'metadata.goals')} onChange={handleChange} />
</div>
