<script>
  import PageNav from '../../../PageNav/index.svelte';
  import Exercises from './Exercises/index.svelte';
  import Readme from './Readme/index.svelte';

  export let path;
  export let tab;
  export let exerciseId;
</script>

<div>
  <PageNav
    navItems={[
      {
        label: 'README.md',
        isActive: tab === 'lessons',
        href: `${path}?tab=lessons`,
      },
      {
        label: 'Exercises',
        isActive: tab === 'exercises',
        href: `${path}?tab=exercises`,
      },
    ]}
  />

  <div class="course relative">
    {#if tab === 'lessons'}
      <Readme />
    {:else if tab === 'exercises'}
      <Exercises {exerciseId} path={`${path}?tab=exercises`} />
    {/if}
  </div>
</div>

<style>
  .course {
    padding: 0 40px;
  }
</style>
