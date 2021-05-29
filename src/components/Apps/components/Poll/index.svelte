<script>
  import PageNav from "../../../PageNav/index.svelte";
  import CloseButton from "../../../Buttons/Close/index.svelte";

  export let handleClose;
</script>

<PageNav title="Poll" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>
