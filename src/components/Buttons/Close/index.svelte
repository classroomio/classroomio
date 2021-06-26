<script>
  import Close24 from "carbon-icons-svelte/lib/Close24";
  import IconButton from "../../IconButton/index.svelte";

  export let onClick;
  export let contained;
</script>

<IconButton {onClick} {contained} title="Close">
  <Close24 class="carbon-icon" title="Close" />
</IconButton>
