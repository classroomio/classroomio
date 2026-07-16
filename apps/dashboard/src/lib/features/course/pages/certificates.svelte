<script lang="ts">
  import IssueCertificateModal from '$features/course/components/ceritficate/issue-certificate-modal.svelte';
  import { RoleBasedSecurity } from '$features/ui';
  import CertificateEdit from '$features/course/components/ceritficate/certificate-edit.svelte';
  import StudentCertificate from '$features/course/components/ceritficate/student-certificate/index.svelte';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();
</script>

<IssueCertificateModal />

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <CertificateEdit {errors} />
</RoleBasedSecurity>
<RoleBasedSecurity onlyStudent allowedRoles={[1, 2, 3]}>
  <StudentCertificate />
</RoleBasedSecurity>
