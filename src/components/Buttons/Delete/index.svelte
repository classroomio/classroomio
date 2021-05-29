<script>
  import Close24 from "carbon-icons-svelte/lib/Close24";
  import IconButton from "../../../IconButton/index.svelte";

  export let onClick;
</script>

<IconButton {onClick}>
  <Close24 class="carbon-icon" title="Close" />
</IconButton>
