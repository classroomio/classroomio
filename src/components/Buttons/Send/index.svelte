<script>
  import SendFilled24 from "carbon-icons-svelte/lib/SendFilled24";
  import IconButton from "../../IconButton/index.svelte";

  export let onClick;
</script>

<IconButton {onClick}>
  <SendFilled24 class="carbon-icon" />
</IconButton>
