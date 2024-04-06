<script lang="ts">
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import IssueCertificateModal from '$lib/components/Course/components/Ceritficate/IssueCertificateModal.svelte';
  // import DeleteConfirmation from '$lib/components/Course/components/People/DeleteConfirmation.svelte';
  import Design from '$lib/components/Course/components/Ceritficate/Design.svelte';
  // import Reports from '$lib/components/Course/components/Ceritficate/Reports.svelte';
  // import { issueCertificateModal } from '$lib/components/Course/components/Ceritficate/store';
  // import { Tabs, Tab } from 'carbon-components-svelte';
  // import TabContent from 'carbon-components-svelte/src/Tabs/TabContent.svelte';
  import StudentCertificate from '$lib/components/Course/components/Ceritficate/StudentCertificate/Index.svelte';

  export let courseId: string = '';
</script>

<IssueCertificateModal />

<CourseContainer bind:courseId>
  <PageNav title="Certificates" disableSticky={true}>
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

  <PageBody className="w-full mx-0" padding="px-3">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <Design />
    </RoleBasedSecurity>
    <RoleBasedSecurity allowedRoles={[3]}>
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
</CourseContainer>
