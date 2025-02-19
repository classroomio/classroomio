<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import IssueCertificateModal from '$lib/components/Course/components/Ceritficate/IssueCertificateModal.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import Design from '$lib/components/Pathway/components/Certificate/Design.svelte';
  import StudentCertificate from '$lib/components/Pathway/components/Certificate/StudentCertificate/Index.svelte';
  import PathwayContainer from '$lib/components/Pathway/components/PathwayContainer.svelte';
  import { RoleBasedSecurity } from '$lib/components/RoleBasedSecurity';
  // import DeleteConfirmation from '$lib/components/Course/components/People/DeleteConfirmation.svelte';

  // import Reports from '$lib/components/Course/components/Ceritficate/Reports.svelte';
  // import { issueCertificateModal } from '$lib/components/Course/components/Ceritficate/store';
  // import { Tabs, Tab } from 'carbon-components-svelte';
  // import TabContent from 'carbon-components-svelte/src/Tabs/TabContent.svelte';

  export let data;
</script>

<IssueCertificateModal />

<PathwayContainer bind:pathwayId={data.pathwayId}>
  <PageNav title={$t('course.navItem.certificates.title')} disableSticky={true}>
    <slot:fragment slot="widget">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <!-- Hide Functionality For V1 -->
        <!-- <PrimaryButton
          className="mr-2 rounded-md text-sm font-medium"
          label="Issue Cert"
          onClick={() => ($issueCertificateModal.open = true)}
        /> -->
      </RoleBasedSecurity>
    </slot:fragment>
  </PageNav>

  <PageBody className="w-full mx-0" padding="px-3 pb-10">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <Design />
    </RoleBasedSecurity>
    <RoleBasedSecurity onlyStudent>
      <StudentCertificate />
    </RoleBasedSecurity>

    <!-- <Tabs autoWidth class="border-b border-gray-200 dark:border-neutral-600">
      <Tab label="Design" />
      <Tab label="Reports" />
      <svelte:fragment slot="content">
        <TabContent>
          <Design />
        </TabContent>

        Temp disable Reports tab for V2
        <TabContent>
          <Reports />
        </TabContent>
      </svelte:fragment>
    </Tabs> -->
  </PageBody>
</PathwayContainer>
