<script lang="ts">
  import IssueCertificateModal from '$lib/components/Course/components/Ceritficate/IssueCertificateModal.svelte';
  import { RoleBasedSecurity } from '$features/ui';
  import Design from '$lib/components/Course/components/Ceritficate/Design.svelte';
  import StudentCertificate from '$lib/components/Course/components/Ceritficate/StudentCertificate/Index.svelte';
</script>

<IssueCertificateModal />

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <Design />
</RoleBasedSecurity>
<RoleBasedSecurity onlyStudent allowedRoles={[3]}>
  <StudentCertificate />
</RoleBasedSecurity>
