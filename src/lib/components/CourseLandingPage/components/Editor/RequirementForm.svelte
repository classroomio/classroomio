<script>
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import get from 'lodash/get';
  import TextEditor from '$lib/components/TextEditor/index.svelte';

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
