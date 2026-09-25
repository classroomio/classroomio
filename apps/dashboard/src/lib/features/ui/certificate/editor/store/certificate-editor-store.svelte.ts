import { DEFAULT_CERTIFICATE_DESIGN, type CertificateDesign, type CertificateTemplateId } from '@cio/certificates';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

export type CertificateEditorPanel = 'templates' | 'content' | 'colors' | 'export';

export interface CertificateEditorDraft {
  templateId: CertificateTemplateId;
  accentColor: string;
  subtitle: string;
  descriptionOverride: string;
  idFormat: string;
  signatories: [
    { name: string; role: string; enabled: boolean; signatureUrl: string },
    { name: string; role: string; enabled: boolean; signatureUrl: string }
  ];
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

export function toDraft(design: CertificateDesign): CertificateEditorDraft {
  return {
    templateId: design.templateId,
    accentColor: design.accentColor,
    subtitle: design.subtitle ?? '',
    descriptionOverride: design.descriptionOverride ?? '',
    idFormat: design.idFormat ?? '',
    signatories: [
      toDraftSignatory(design.signatories?.[0], DEFAULT_CERTIFICATE_DESIGN.signatories[0]),
      toDraftSignatory(design.signatories?.[1], DEFAULT_CERTIFICATE_DESIGN.signatories[1])
    ]
  };
}

export function fromDraft(draft: CertificateEditorDraft): CertificateDesign {
  return {
    templateId: draft.templateId,
    accentColor: draft.accentColor,
    subtitle: draft.subtitle.trim() || undefined,
    descriptionOverride: draft.descriptionOverride.trim() || undefined,
    idFormat: draft.idFormat.trim() || undefined,
    signatories: [fromDraftSignatory(draft.signatories[0]), fromDraftSignatory(draft.signatories[1])]
  };
}

export class ParameterizedCertificateEditorStore {
  activePanel = $state<CertificateEditorPanel>('templates');
  draft = $state<CertificateEditorDraft>(toDraft(DEFAULT_CERTIFICATE_DESIGN));
  initial = $state<CertificateEditorDraft>(toDraft(DEFAULT_CERTIFICATE_DESIGN));
  isSaving = $state(false);
  private signatureUploadCount = $state(0);

  readonly isSignatureUploading = $derived(this.signatureUploadCount > 0);

  private saveFn?: (design: CertificateDesign) => Promise<boolean>;

  readonly isDirty = $derived(JSON.stringify(this.draft) !== JSON.stringify(this.initial));

  init(design: CertificateDesign, saveFn?: (design: CertificateDesign) => Promise<boolean>) {
    this.initial = toDraft(design);
    this.draft = toDraft(design);
    if (saveFn) {
      this.saveFn = saveFn;
    }
  }

  reset() {
    this.draft = toDraft(fromDraft(this.initial));
  }

  setTemplate(templateId: CertificateTemplateId) {
    this.draft.templateId = templateId;
  }

  setAccent(color: string) {
    this.draft.accentColor = color;
  }

  beginSignatureUpload() {
    this.signatureUploadCount += 1;
  }

  endSignatureUpload() {
    if (this.signatureUploadCount > 0) {
      this.signatureUploadCount -= 1;
    }
  }

  setSignatorySignatureUrl(index: 0 | 1, signatureUrl: string) {
    const signatory = this.draft.signatories?.[index] ?? {
      name: DEFAULT_CERTIFICATE_DESIGN.signatories[index].name,
      role: DEFAULT_CERTIFICATE_DESIGN.signatories[index].role,
      enabled: DEFAULT_CERTIFICATE_DESIGN.signatories[index].enabled ?? true,
      signatureUrl: ''
    };
    const nextSignatories = [...(this.draft.signatories ?? [])] as CertificateEditorDraft['signatories'];
    nextSignatories[index] = { ...signatory, signatureUrl };

    this.draft = {
      ...this.draft,
      signatories: nextSignatories
    };
  }

  toDesign(): CertificateDesign {
    return fromDraft(this.draft);
  }

  async save(): Promise<boolean> {
    if (!this.saveFn) return false;

    if (this.isSignatureUploading) {
      snackbar.error(t.get('certificate.editor.signature_upload_in_progress'));
      return false;
    }

    this.isSaving = true;
    try {
      const design = fromDraft(this.draft);
      const success = await this.saveFn(design);
      if (success) {
        this.initial = toDraft(design);
        snackbar.success(t.get('certificate.editor.saved'));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save certificate design:', err);
      snackbar.error(t.get('certificate.editor.save_failed'));
      return false;
    } finally {
      this.isSaving = false;
    }
  }
}
