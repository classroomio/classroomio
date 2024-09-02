<script>
  import { getLectureNo } from '$lib/components/Course/function';
  import Chip from '$lib/components/Chip/index.svelte';

  export let index;
  export let title;
</script>

<div class="px-2 py-1 m-2 border rounded">
  <Chip value={getLectureNo(index + 1, '0')} className="bg-primary-100 text-primary-700 inline" />
  <p class="ml-2 text-xs font-light dark:text-white inline">
    {title}
  </p>
</div>
