<script lang="ts">
  import IssueCertificateModal from '$lib/components/Course/components/Ceritficate/IssueCertificateModal.svelte';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { PageBody } from '$lib/components/Page';
  import { RoleBasedSecurity } from '$features/ui';
  // import DeleteConfirmation from '$lib/components/Course/components/People/DeleteConfirmation.svelte';
  import Design from '$lib/components/Course/components/Ceritficate/Design.svelte';
  // import Reports from '$lib/components/Course/components/Ceritficate/Reports.svelte';
  // import { issueCertificateModal } from '$lib/components/Course/components/Ceritficate/store';
  import StudentCertificate from '$lib/components/Course/components/Ceritficate/StudentCertificate/Index.svelte';

  let { data = $bindable() } = $props();
</script>

<IssueCertificateModal />

<CourseContainer courseId={data.courseId}>
  <PageBody className="w-full mx-0" padding="px-3 pb-10">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <Design />
    </RoleBasedSecurity>
    <RoleBasedSecurity onlyStudent allowedRoles={[3]}>
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
