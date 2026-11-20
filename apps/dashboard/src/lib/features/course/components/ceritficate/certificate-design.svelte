<script lang="ts">
  import { resolve } from '$app/paths';
  import { CertificateDesignView } from '$features/ui/certificate';
  import { courseApi } from '$features/course/api';
  import { currentOrg } from '$lib/utils/store/org';
  import { resolveCertificateDesign } from '@cio/certificates';
  import { CERTIFICATE_PREVIEW_SEQ, formatCertificateId } from '@cio/utils/functions';

  const design = $derived(resolveCertificateDesign(courseApi.course?.certificate));

  const previewData = $derived({
    recipientName: 'Eleanor Vance',
    courseName: courseApi.course?.title ?? 'Course Title',
    courseDescription: design.descriptionOverride || courseApi.course?.description || '',
    orgName: $currentOrg.name || 'Organization',
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }),
    certificateId: formatCertificateId(design.idFormat || undefined, CERTIFICATE_PREVIEW_SEQ, new Date())
  });

  const courseId = $derived(courseApi.course?.id ?? '');
  const editorHref = $derived(courseId ? resolve('/courses/[id]/certificates/editor', { id: courseId }) : '');
</script>

<CertificateDesignView {design} {previewData} {editorHref} />
