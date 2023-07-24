<script context="module">
  import {
    fetchCourse,
  } from '../../../utils/services/courses';

  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';

  import PageNav from '../../../components/PageNav/index.svelte';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import RoleBasedSecurity from '../../../components/RoleBasedSecurity/index.svelte';
  import { setCourse, course, group } from '../../../components/Course/store';
  import IssueCertModal from '../../../components/Course/components/Ceritficate/IssueCertModal.svelte';
  // import DeleteConfirmation from '../../../components/Course/components/People/DeleteConfirmation.svelte';
  import Design from '../../../components/Course/components/Ceritficate/Design.svelte';
  import Reports from '../../../components/Course/components/Ceritficate/Reports.svelte';

  import { issueCertModal } from '../../../components/Course/components/Ceritficate/store';
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';

  export let courseId: string = '';
  let isStudent = false;
  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourse(data);
  });
</script>

<IssueCertModal />
<CourseContainer bind:isStudent>
  <PageNav title="Certificates" disableSticky={true}>
    <slot:fragment slot="widget">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="mr-2 rounded-md text-sm font-medium"
          label="Issue Cert"
          onClick={() => ($issueCertModal.open = true)}
        />
      </RoleBasedSecurity>
    </slot:fragment>
  </PageNav>
  <PageBody className="w-full mx-0" padding="px-0">
    <Tabs autoWidth class="border-b border-gray-200">
      <Tab label="Design" />
      <Tab label="Reports" />
      <svelte:fragment slot="content">
        <TabContent>
          <Design />
        </TabContent>

        <TabContent>
          <Reports />
        </TabContent>
      </svelte:fragment>
    </Tabs>
  </PageBody>
</CourseContainer>

<style>
</style>
