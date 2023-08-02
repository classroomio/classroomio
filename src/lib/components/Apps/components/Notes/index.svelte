<script>
  import PageNav from '$lib/components/PageNav/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';

  export let handleClose;
</script>

<PageNav title="Note" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>
