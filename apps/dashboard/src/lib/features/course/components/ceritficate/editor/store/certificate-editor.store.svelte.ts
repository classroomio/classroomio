import {
  DEFAULT_CERTIFICATE_DESIGN,
  resolveTemplateId,
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
  accentColor: string;
  subtitle: string;
  descriptionOverride: string;
  idFormat: string;
  signatories: [{ name: string; role: string }, { name: string; role: string }];
}

function toDraft(design: CertificateDesign): CertificateEditorDraft {
  return {
    templateId: design.templateId,
    accentColor: design.accentColor,
    subtitle: design.subtitle ?? '',
    descriptionOverride: design.descriptionOverride ?? '',
    idFormat: design.idFormat ?? '',
    signatories: [
      { name: design.signatories[0]?.name ?? '', role: design.signatories[0]?.role ?? '' },
      { name: design.signatories[1]?.name ?? '', role: design.signatories[1]?.role ?? '' }
    ]
  };
}

function fromDraft(draft: CertificateEditorDraft): CertificateDesign {
  return {
    templateId: draft.templateId,
    accentColor: draft.accentColor,
    subtitle: draft.subtitle.trim() || undefined,
    descriptionOverride: draft.descriptionOverride.trim() || undefined,
    idFormat: draft.idFormat.trim() || undefined,
    signatories: [
      { name: draft.signatories[0].name, role: draft.signatories[0].role },
      { name: draft.signatories[1].name, role: draft.signatories[1].role }
    ]
  };
}

function readStoredDesign(): CertificateDesign {
  const certificate = courseApi.course?.certificate;
  const stored = certificate?.design as Partial<CertificateDesign> | undefined;
  const legacyTheme = certificate?.theme;

  return {
    templateId: resolveTemplateId(stored?.templateId ?? legacyTheme),
    accentColor: stored?.accentColor ?? DEFAULT_CERTIFICATE_DESIGN.accentColor,
    subtitle: stored?.subtitle ?? DEFAULT_CERTIFICATE_DESIGN.subtitle,
    descriptionOverride: stored?.descriptionOverride,
    signatories: [
      {
        name: stored?.signatories?.[0]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].name,
        role: stored?.signatories?.[0]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].role
      },
      {
        name: stored?.signatories?.[1]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].name,
        role: stored?.signatories?.[1]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].role
      }
    ],
    idFormat: stored?.idFormat ?? DEFAULT_CERTIFICATE_DESIGN.idFormat
  };
}

class CertificateEditorStore {
  activePanel = $state<CertificateEditorPanel>('templates');
  draft = $state<CertificateEditorDraft>(toDraft(DEFAULT_CERTIFICATE_DESIGN));
  initial = $state<CertificateEditorDraft>(toDraft(DEFAULT_CERTIFICATE_DESIGN));
  isSaving = $state(false);
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
  }

  setAccent(color: string) {
    this.draft.accentColor = color;
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

    this.isSaving = true;
    try {
      const certificate = {
        ...(course.certificate ?? {}),
        design: fromDraft(this.draft),
        theme: this.draft.templateId
      };

      const updated = await courseApi.update(course.id, { certificate }, { showSuccessToast: false });

      if (updated) {
        this.initial = {
          ...this.draft,
          signatories: [{ ...this.draft.signatories[0] }, { ...this.draft.signatories[1] }]
        };
        snackbar.success(t.get('course.navItem.certificates.editor.saved'));
      }
    } finally {
      this.isSaving = false;
    }
  }
}

export const certificateEditorStore = new CertificateEditorStore();
