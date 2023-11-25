<script>
  import SendFilled from 'carbon-icons-svelte/lib/SendFilled.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';

  export let onClick;
</script>

<IconButton {onClick}>
  <SendFilled size={24} class="carbon-icon dark:text-white" />
</IconButton>
