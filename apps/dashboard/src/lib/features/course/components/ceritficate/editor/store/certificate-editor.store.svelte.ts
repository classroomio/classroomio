import {
  DEFAULT_CERTIFICATE_DESIGN,
  resolveCertificateDesign,
  type CertificateDesign,
  type CertificateTemplateId,
  type StoredCertificateDesign
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
  signatories: Array<{
    id?: string;
    name: string;
    role: string;
    enabled: boolean;
    signatureUrl: string;
    signatureAssetId?: string;
  }>;
  elements?: CertificateDesign['elements'];
  copy?: CertificateDesign['copy'];
  border?: CertificateDesign['border'];
  typography?: CertificateDesign['typography'];
  background?: CertificateDesign['background'];
  badge?: CertificateDesign['badge'];
  qrCode?: CertificateDesign['qrCode'];
  layout?: CertificateDesign['layout'];
}

function toDraftSignatory(signatory: CertificateDesign['signatories'][number]) {
  return {
    id: signatory.id,
    name: signatory.name,
    role: signatory.role,
    enabled: signatory.enabled,
    signatureUrl: signatory.signatureUrl ?? '',
    signatureAssetId: signatory.signatureAssetId
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
    id: signatory.id,
    name: signatory.name,
    role: signatory.role,
    enabled: signatory.enabled,
    signatureUrl: isPersistableSignatureUrl(signatureUrl) ? signatureUrl : undefined,
    signatureAssetId: signatory.signatureAssetId
  };
}

function cloneElements(elements: CertificateDesign['elements']): CertificateDesign['elements'] {
  if (!elements) return undefined;

  return Object.fromEntries(
    Object.entries(elements).map(([elementId, layout]) => [elementId, layout ? { ...layout } : layout])
  ) as CertificateDesign['elements'];
}

function toDraft(design: CertificateDesign): CertificateEditorDraft {
  return {
    templateId: design.templateId,
    sourcePresetId: design.sourcePresetId,
    accentColor: design.accentColor,
    subtitle: design.subtitle ?? '',
    descriptionOverride: design.descriptionOverride ?? '',
    idFormat: design.idFormat ?? '',
    signatories: design.signatories.slice(0, 3).map(toDraftSignatory),
    elements: cloneElements(design.elements),
    copy: design.copy ? { ...design.copy } : undefined,
    border: design.border ? { ...design.border } : undefined,
    typography: design.typography ? { ...design.typography } : undefined,
    background: design.background ? { ...design.background } : undefined,
    badge: design.badge ? { ...design.badge } : undefined,
    qrCode: design.qrCode ? { ...design.qrCode } : undefined,
    layout: design.layout ? { ...design.layout } : undefined
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
    signatories: draft.signatories.map(fromDraftSignatory),
    elements: draft.elements,
    copy: draft.copy,
    border: draft.border,
    typography: draft.typography,
    background: draft.background,
    badge: draft.badge,
    qrCode: draft.qrCode,
    layout: draft.layout
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
    if (this.isSignatureUploading) return;

    this.draft = toDraft(fromDraft(this.initial));
  }

  setTemplate(templateId: CertificateTemplateId) {
    if (this.isSignatureUploading) return;

    this.draft.templateId = templateId;
    this.draft.sourcePresetId = undefined;
    this.draft.elements = undefined;
    this.draft.copy = undefined;
    this.draft.border = undefined;
    this.draft.typography = undefined;
    this.draft.background = undefined;
    this.draft.badge = undefined;
    this.draft.qrCode = undefined;
    this.draft.layout = undefined;
  }

  applyPreset(preset: { id: string; design: Record<string, unknown> }) {
    if (this.isSignatureUploading) return;

    const design = resolveCertificateDesign({ design: preset.design as StoredCertificateDesign });
    this.draft = toDraft({ ...design, sourcePresetId: preset.id });
  }

  setAccent(color: string) {
    this.draft.accentColor = color;
  }

  addSignatory() {
    if (this.draft.signatories.length >= 3) return;

    this.draft.signatories.push({
      id: `sig-${crypto.randomUUID()}`,
      name: '',
      role: '',
      enabled: true,
      signatureUrl: '',
      signatureAssetId: undefined
    });
  }

  removeSignatory(index: number) {
    if (!this.draft.signatories[index]) return;

    this.draft.signatories.splice(index, 1);
  }

  setSignatorySignatureUrl(index: number, signatureUrl: string) {
    const signatory = this.draft.signatories[index];
    if (!signatory) return;

    const nextSignatories = [...this.draft.signatories];
    nextSignatories[index] = { ...signatory, signatureUrl, signatureAssetId: undefined };

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
