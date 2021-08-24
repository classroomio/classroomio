<script>
  import { stores, goto } from '@sapper/app';
  const { page } = stores();

  $: console.log('route', $page);
</script>
