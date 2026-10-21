import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { getCourseById, getCourseWithOrgData, recordPluginAuditEvent, updateCourse } from '@cio/db/queries';
import { normalizeCertificateDesign, STARTER_TEMPLATES } from '@classroomio/certificate-kit';

export interface PluginAvailableCertificateTemplate {
  id: string;
  name: string;
  style: string;
  description: string;
  accentColor: string;
  subtitle: string;
  version: number;
  design: Record<string, unknown>;
}

export interface PluginAppliedCertificateTemplate {
  courseId: string;
  isDownloadable: boolean;
  design: Record<string, unknown> | null;
  sourceTemplate: {
    pluginId: string;
    externalTemplateId: string;
    version: number;
    name: string;
    appliedAt: string;
  } | null;
}

export async function listAvailableCertificateTemplatesForPlugin(
  installationId: string,
  orgId: string,
  actorId?: string
): Promise<PluginAvailableCertificateTemplate[]> {
  await authorizePluginRequest({
    installationId,
    organizationId: orgId,
    actorId,
    requiredScope: 'certificate.template:read'
  });

  return STARTER_TEMPLATES.map((tmpl) => ({
    id: tmpl.id,
    name: tmpl.name,
    style: tmpl.style,
    description: tmpl.description,
    accentColor: tmpl.accentColor,
    subtitle: tmpl.subtitle,
    version: 1,
    design: tmpl.initialDesign as unknown as Record<string, unknown>
  }));
}

export async function getAppliedCertificateTemplateForPlugin(
  installationId: string,
  orgId: string,
  courseId: string,
  actorId?: string
): Promise<PluginAppliedCertificateTemplate> {
  await authorizePluginRequest({
    installationId,
    organizationId: orgId,
    actorId,
    requiredScope: 'certificate.template:read',
    allowedRoles: actorId ? ['admin', 'tutor'] : undefined
  });

  const orgData = await getCourseWithOrgData(courseId);
  if (!orgData || orgData.orgId !== orgId) {
    throw new AppError('Course not found in this organization', 'NOT_FOUND', 404);
  }

  const [course] = await getCourseById(courseId);
  if (!course) {
    throw new AppError('Course not found in this organization', 'NOT_FOUND', 404);
  }

  const existingCert = (course.certificate as Record<string, unknown>) ?? {};
  const design = existingCert.design
    ? (normalizeCertificateDesign(existingCert.design) as unknown as Record<string, unknown>)
    : null;
  const sourceTemplate = (existingCert.sourceTemplate as PluginAppliedCertificateTemplate['sourceTemplate']) ?? null;

  return {
    courseId,
    isDownloadable: Boolean(existingCert.isDownloadable),
    design,
    sourceTemplate
  };
}

export interface ApplyCertificateTemplateServiceInput {
  installationId: string;
  courseId: string;
  orgId: string;
  userId: string;
  externalTemplateId: string;
  externalTemplateVersion: number;
  name: string;
  design: unknown;
}

export interface ApplyCertificateTemplateServiceResult {
  success: boolean;
  courseId: string;
  appliedAt: string;
  templateVersion: number;
  design: Record<string, unknown>;
}

export async function applyCertificateTemplate(
  input: ApplyCertificateTemplateServiceInput
): Promise<ApplyCertificateTemplateServiceResult> {
  const authorization = await authorizePluginRequest({
    installationId: input.installationId,
    organizationId: input.orgId,
    actorId: input.userId,
    requiredScope: 'certificate.template:write',
    allowedRoles: ['admin', 'tutor']
  });
  const installation = authorization.installation;

  const orgData = await getCourseWithOrgData(input.courseId);
  if (!orgData || orgData.orgId !== input.orgId) {
    throw new AppError('Course not found in this organization', 'NOT_FOUND', 404);
  }

  const [course] = await getCourseById(input.courseId);
  if (!course) {
    throw new AppError('Course not found in this organization', 'NOT_FOUND', 404);
  }

  const normalizedDesign = normalizeCertificateDesign(input.design);

  const appliedAt = new Date().toISOString();
  const existingCert = (course.certificate as Record<string, unknown>) ?? {};
  const updatedCert = {
    ...existingCert,
    isDownloadable: true,
    design: normalizedDesign,
    sourceTemplate: {
      pluginId: installation.pluginId,
      externalTemplateId: input.externalTemplateId,
      version: input.externalTemplateVersion,
      name: input.name,
      appliedAt
    }
  };

  await updateCourse(input.courseId, { certificate: updatedCert as any });

  await recordPluginAuditEvent({
    installationId: installation.id,
    organizationId: input.orgId,
    actorProfileId: input.userId,
    action: 'certificate_template.applied',
    resource: input.courseId,
    outcome: 'success',
    metadata: {
      externalTemplateId: input.externalTemplateId,
      templateVersion: input.externalTemplateVersion,
      name: input.name
    }
  });

  return {
    success: true,
    courseId: input.courseId,
    appliedAt,
    templateVersion: input.externalTemplateVersion,
    design: normalizedDesign as unknown as Record<string, unknown>
  };
}
