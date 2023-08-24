<script>
  import { page } from '$app/stores';
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import Profile from '$lib/components/LMS/components/Profile.svelte';

  let selected = 0;
  const tabs = [
    {
      key: 0,
      label: 'Profile',
      tabKey: '',
      href: $page.url.pathname
    }
  ];
</script>

<section class="max-w-6xl mx-auto">
  <div class="m-2 md:m-5">
    <Tabs autoWidth bind:selected>
      {#each tabs as tab}
        <Tab label={tab.label} href={tab.href} />
      {/each}
      <svelte:fragment slot="content">
        <TabContent>
          <Profile />
        </TabContent>
      </svelte:fragment>
    </Tabs>
  </div>
</section>
