import {
  DEFAULT_CERTIFICATE_DESIGN,
  resolveCertificateDesign,
  type CertificateDesign,
  type CertificateTemplateId
} from '@cio/certificates';

import { courseApi } from '$features/course/api';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

export type CertificateEditorPanel = 'templates' | 'content' | 'colors' | 'export';

/**
 * The store keeps optional fields as concrete strings so two-way bindings to
 * inputs are simple — we collapse empty strings to `undefined` only when
 * shipping a payload back to the API.
 */
export interface CertificateEditorDraft {
  templateId: CertificateTemplateId;
  sourcePresetId?: string;
  accentColor: string;
  subtitle: string;
  descriptionOverride: string;
  idFormat: string;
  signatories: [
    { name: string; role: string; enabled: boolean; signatureUrl: string },
    { name: string; role: string; enabled: boolean; signatureUrl: string }
  ];
  border?: CertificateDesign['border'];
  typography?: CertificateDesign['typography'];
  background?: CertificateDesign['background'];
  badge?: CertificateDesign['badge'];
  qrCode?: CertificateDesign['qrCode'];
}

function toDraftSignatory(
  signatory: CertificateDesign['signatories'][number] | undefined,
  fallback: CertificateDesign['signatories'][number]
) {
  return {
    name: signatory?.name ?? fallback.name,
    role: signatory?.role ?? fallback.role,
    enabled: signatory?.enabled ?? fallback.enabled ?? true,
    signatureUrl: signatory?.signatureUrl ?? ''
  };
}

function isPersistableSignatureUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  return !trimmed.startsWith('blob:') && !trimmed.startsWith('data:');
}

function fromDraftSignatory(signatory: CertificateEditorDraft['signatories'][number]) {
  const signatureUrl = signatory.signatureUrl.trim();

  return {
    name: signatory.name,
    role: signatory.role,
    enabled: signatory.enabled,
    signatureUrl: isPersistableSignatureUrl(signatureUrl) ? signatureUrl : undefined
  };
}

function toDraft(design: CertificateDesign): CertificateEditorDraft {
  return {
    templateId: design.templateId,
    sourcePresetId: (design as any).sourcePresetId,
    accentColor: design.accentColor,
    subtitle: design.subtitle ?? '',
    descriptionOverride: design.descriptionOverride ?? '',
    idFormat: design.idFormat ?? '',
    signatories: [
      toDraftSignatory(design.signatories[0], DEFAULT_CERTIFICATE_DESIGN.signatories[0]),
      toDraftSignatory(design.signatories[1], DEFAULT_CERTIFICATE_DESIGN.signatories[1])
    ],
    border: design.border,
    typography: design.typography,
    background: design.background,
    badge: design.badge,
    qrCode: design.qrCode
  };
}

function fromDraft(draft: CertificateEditorDraft): CertificateDesign {
  const result: CertificateDesign & { sourcePresetId?: string } = {
    templateId: draft.templateId,
    rendererTemplateId: draft.border != null ? 'modular' : draft.templateId,
    accentColor: draft.accentColor,
    subtitle: draft.subtitle.trim() || undefined,
    descriptionOverride: draft.descriptionOverride.trim() || undefined,
    idFormat: draft.idFormat.trim() || undefined,
    signatories: [fromDraftSignatory(draft.signatories[0]), fromDraftSignatory(draft.signatories[1])],
    border: draft.border,
    typography: draft.typography,
    background: draft.background,
    badge: draft.badge,
    qrCode: draft.qrCode
  };

  if (draft.sourcePresetId) {
    result.sourcePresetId = draft.sourcePresetId;
  }

  return result;
}

function readStoredDesign(): CertificateDesign {
  return resolveCertificateDesign(courseApi.course?.certificate);
}

class CertificateEditorStore {
  activePanel = $state<CertificateEditorPanel>('templates');
  draft = $state<CertificateEditorDraft>(toDraft(DEFAULT_CERTIFICATE_DESIGN));
  initial = $state<CertificateEditorDraft>(toDraft(DEFAULT_CERTIFICATE_DESIGN));
  isSaving = $state(false);
  isSignatureUploading = $state(false);
  #initializedCourseId: string | null = null;

  readonly isDirty = $derived(JSON.stringify(this.draft) !== JSON.stringify(this.initial));

  syncFromCourse(courseId: string, force = false) {
    if (!force && this.#initializedCourseId === courseId) return;

    const stored = readStoredDesign();
    this.initial = toDraft(stored);
    this.draft = toDraft(stored);
    this.#initializedCourseId = courseId;
  }

  reset() {
    this.draft = toDraft(fromDraft(this.initial));
  }

  setTemplate(templateId: CertificateTemplateId) {
    this.draft.templateId = templateId;
    this.draft.sourcePresetId = undefined;
    this.draft.border = undefined;
    this.draft.badge = undefined;
  }

  applyPreset(preset: { id: string; design: Record<string, any> }) {
    const design = preset.design ?? {};
    const rendererId = (design.rendererTemplateId || design.templateId || 'classique') as CertificateTemplateId;
    this.draft.templateId = rendererId;
    this.draft.sourcePresetId = preset.id;
    if (design.accentColor) this.draft.accentColor = design.accentColor;
    if (design.subtitle !== undefined) this.draft.subtitle = design.subtitle ?? '';
    if (design.descriptionOverride !== undefined) this.draft.descriptionOverride = design.descriptionOverride ?? '';
    if (design.idFormat !== undefined) this.draft.idFormat = design.idFormat ?? '';
    if (Array.isArray(design.signatories)) {
      this.draft.signatories = [
        toDraftSignatory(design.signatories[0], DEFAULT_CERTIFICATE_DESIGN.signatories[0]),
        toDraftSignatory(design.signatories[1], DEFAULT_CERTIFICATE_DESIGN.signatories[1])
      ];
    }
    if (design.border) this.draft.border = design.border;
    if (design.typography) this.draft.typography = design.typography;
    if (design.background) this.draft.background = design.background;
    if (design.badge) this.draft.badge = design.badge;
    if (design.qrCode) this.draft.qrCode = design.qrCode;
  }

  setAccent(color: string) {
    this.draft.accentColor = color;
  }

  setSignatorySignatureUrl(index: 0 | 1, signatureUrl: string) {
    const signatory = this.draft.signatories[index];
    const nextSignatories = [...this.draft.signatories] as CertificateEditorDraft['signatories'];
    nextSignatories[index] = { ...signatory, signatureUrl };

    this.draft = {
      ...this.draft,
      signatories: nextSignatories
    };
  }

  /**
   * Returns a render-ready design with empty optional strings collapsed to
   * `undefined`, suitable for handing to `Certificate.Preview` / API payload.
   */
  toDesign(): CertificateDesign {
    return fromDraft(this.draft);
  }

  async save() {
    const course = courseApi.course;
    if (!course?.id) return;

    if (this.isSignatureUploading) {
      snackbar.error(t.get('course.navItem.certificates.editor.signature_upload_in_progress'));
      return;
    }

    this.isSaving = true;
    try {
      const design = fromDraft(this.draft);
      const certificate = {
        ...(course.certificate ?? {}),
        design,
        theme: this.draft.templateId
      };

      const updated = await courseApi.update(course.id, { certificate }, { showSuccessToast: false });

      if (updated) {
        if (courseApi.course) {
          courseApi.course.certificate = {
            ...(courseApi.course.certificate ?? {}),
            design,
            theme: this.draft.templateId
          };
        }

        this.initial = toDraft(design);
        this.#initializedCourseId = null;
        this.syncFromCourse(course.id, true);
        snackbar.success(t.get('course.navItem.certificates.editor.saved'));
        return;
      }

      if (Object.keys(courseApi.errors).length > 0) {
        snackbar.error(t.get('course.navItem.certificates.editor.save_failed'));
      }
    } finally {
      this.isSaving = false;
    }
  }
}

export const certificateEditorStore = new CertificateEditorStore();
