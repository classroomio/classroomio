<script>
  import Close24 from 'carbon-icons-svelte/lib/Close24';
  import IconButton from '../../IconButton/index.svelte';

  export let onClick;
  export let contained;
  export let color = '';
</script>

<IconButton {onClick} {color} {contained}>
  <Close24 class="carbon-icon" title="Close" />
</IconButton>
