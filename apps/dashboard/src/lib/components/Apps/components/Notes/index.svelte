<script>
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import { PageNav } from '$lib/components/Page';

  export let handleClose;
</script>

<PageNav title="Note" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>
