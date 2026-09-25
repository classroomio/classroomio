<script lang="ts">
  import { resolve } from '$app/paths';
  import { CertificateDesignView } from '$features/ui/certificate';
  import { learningPathApi } from '$features/learning-path/api';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { resolveCertificateDesign, type CertificateDesign } from '@cio/certificates';
  import { CERTIFICATE_PREVIEW_SEQ, formatCertificateId } from '@cio/utils/functions';
  const path = $derived(learningPathApi.currentPath);
  const design: CertificateDesign = $derived(resolveCertificateDesign(path?.certificate));

  const previewData = $derived({
    recipientName: 'Eleanor Vance',
    courseName: path?.name ?? 'Learning Path Title',
    courseDescription: design.descriptionOverride || path?.description || '',
    orgName: $currentOrg.name || 'Organization',
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }),
    certificateId: formatCertificateId(design.idFormat || undefined, CERTIFICATE_PREVIEW_SEQ, new Date())
  });

  const publicId = $derived(path?.publicId ?? '');
  const editorHref = $derived(publicId ? resolve('/paths/[publicId]/certificates/editor', { publicId }) : '#');
</script>

<CertificateDesignView {design} {previewData} {editorHref} disabled={$isFreePlan || !publicId} />
