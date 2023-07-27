<script context="module">
  import { fetchCourse } from '../../../utils/services/courses';

  export async function preload({ params = { id: '' } }) {
    return { courseId: params.id };
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';

  import PageNav from '../../../components/PageNav/index.svelte';
  // import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import RoleBasedSecurity from '../../../components/RoleBasedSecurity/index.svelte';
  import { setCourse, course } from '../../../components/Course/store';
  import IssueCertificateModal from '../../../components/Course/components/Ceritficate/IssueCertificateModal.svelte';
  // import DeleteConfirmation from '../../../components/Course/components/People/DeleteConfirmation.svelte';
  import Design from '../../../components/Course/components/Ceritficate/Design.svelte';
  // import Reports from '../../../components/Course/components/Ceritficate/Reports.svelte';

  // import { issueCertificateModal } from '../../../components/Course/components/Ceritficate/store';
  import { Tabs, Tab } from 'carbon-components-svelte';
  import TabContent from 'carbon-components-svelte/src/Tabs/TabContent.svelte';

  export let courseId: string = '';
  let isStudent = false;

  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourse(data);
  });
</script>

<IssueCertificateModal />

<CourseContainer bind:isStudent>
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

  <PageBody className="w-full mx-0" padding="px-0">
    <Tabs autoWidth class="border-b border-gray-200">
      <Tab label="Design" />
      <!-- <Tab label="Reports" /> -->
      <svelte:fragment slot="content">
        <TabContent>
          <Design />
        </TabContent>

        <!-- Temp disable Reports tab for V2 -->
        <!-- <TabContent>
          <Reports />
        </TabContent> -->
      </svelte:fragment>
    </Tabs>
  </PageBody>
</CourseContainer>
