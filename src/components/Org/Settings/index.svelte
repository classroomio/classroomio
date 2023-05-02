<script>
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import Profile from './Profile.svelte';
  // import Account from './Account.svelte';
  import OrgSettings from './OrgSettings.svelte';
</script>

<Tabs autoWidth>
  <Tab label="Profile" />
  <!-- <Tab label="Account" /> -->
  <Tab label="Organization Settings" />
  <svelte:fragment slot="content">
    <TabContent>
      <Profile />
    </TabContent>
    <!-- <TabContent>
      <Account />
    </TabContent> -->
    <TabContent>
      <OrgSettings />
    </TabContent>
  </svelte:fragment>
</Tabs>
