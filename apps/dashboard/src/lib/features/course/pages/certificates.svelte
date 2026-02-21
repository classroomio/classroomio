<script lang="ts">
  import IssueCertificateModal from '$features/course/components/ceritficate/issue-certificate-modal.svelte';
  import { RoleBasedSecurity } from '$features/ui';
  import Design from '$features/course/components/ceritficate/design.svelte';
  import StudentCertificate from '$features/course/components/ceritficate/student-certificate/index.svelte';
</script>

<IssueCertificateModal />

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <Design />
</RoleBasedSecurity>
<RoleBasedSecurity onlyStudent allowedRoles={[3]}>
  <StudentCertificate />
</RoleBasedSecurity>
