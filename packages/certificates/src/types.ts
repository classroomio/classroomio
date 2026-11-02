export const CERTIFICATE_TEMPLATE_IDS = ['classique', 'brutalist', 'noir', 'poster', 'minimal'] as const;
export type CertificateTemplateId = (typeof CERTIFICATE_TEMPLATE_IDS)[number];

export interface CertificateSignatory {
  name: string;
  role: string;
  enabled: boolean;
  signatureUrl?: string;
}

export interface CertificateDesign {
  templateId: CertificateTemplateId;
  accentColor: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories: [CertificateSignatory, CertificateSignatory];
  idFormat?: string;
}

export interface StoredCertificateSignatory {
  name?: string;
  role?: string;
  enabled?: boolean;
  signatureUrl?: string;
}

export interface StoredCertificateDesign {
  templateId?: CertificateTemplateId | string;
  accentColor?: string;
  subtitle?: string;
  descriptionOverride?: string;
  signatories?:
    | [StoredCertificateSignatory?, StoredCertificateSignatory?]
    | StoredCertificateSignatory[]
    | readonly StoredCertificateSignatory[];
  idFormat?: string;
}

export interface CertificateDocumentSignatory {
  id?: string;
  name: string;
  role: string;
  enabled: boolean;
  signatureUrl?: string;
}

export interface GradientStop {
  offset: number;
  color: string;
}

export type CertificateShapeFill =
  | { type: 'none' }
  | { type: 'solid'; color: string }
  | { type: 'linear-gradient'; angle: number; stops: GradientStop[] };

export type CertificateShapeStroke = {
  color: string;
  width: number;
  style: 'solid' | 'dashed';
} | null;

export interface CertificateShapeFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CertificateShapeObject {
  id: string;
  objectType: 'shape';
  shape: 'rectangle' | 'ellipse' | 'line' | 'frame';
  frame: CertificateShapeFrame;
  fill: CertificateShapeFill;
  stroke: CertificateShapeStroke;
  borderRadius: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
}

export interface CertificateDocumentV1 {
  version: 1;
  templateSourceId?: string;
  templateName?: string;
  templateId?: string;
  rendererTemplateId?: string;
  accentColor: string;
  title: string;
  subtitle: string;
  descriptionOverride?: string;
  idFormat: string;
  signatories: CertificateDocumentSignatory[];
  shapes?: CertificateShapeObject[];
  elements?: Record<
    string,
    {
      enabled?: boolean;
      positionMode?: 'auto' | 'custom';
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      zIndex?: number;
    }
  >;
  border?: { style?: string; width?: number; primaryColor?: string; accentColor?: string };
  typography?: {
    titleFont?: string;
    recipientFont?: string;
    bodyFont?: string;
    primaryColor?: string;
    letterSpacing?: number;
  };
  background?: {
    style?: 'parchment' | 'guilloche' | 'solid' | 'gradient';
    primaryColor?: string;
    secondaryColor?: string;
  };
  badge?: { style?: string; label?: string; foilColor?: string; customImageUrl?: string };
  qrCode?: { enabled?: boolean; position?: string };
  copy?: {
    title?: string;
    presentation?: string;
    completion?: string;
    dateLabel?: string;
    verifiedCredentialLabel?: string;
    organizationName?: string;
  };
  [key: string]: unknown;
}

export interface CertificatePluginSource {
  kind: 'plugin';
  pluginId: string;
  installationId: string;
  pluginVersion: string;
  templateSourceId?: string;
  templateName?: string;
}

export type CertificatePresentationV1 =
  | {
      kind: 'preset';
      presetId: CertificateTemplateId;
      overrides?: Partial<CertificateDesign>;
    }
  | {
      kind: 'document';
      schema: 'classroomio.certificate-document';
      version: 1;
      source?: CertificatePluginSource;
      document: CertificateDocumentV1;
    };

/**
 * Shape of certificate metadata persisted in the database (e.g. `course.certificate`).
 */
export interface StoredCertificateRecord {
  isDownloadable?: boolean;
  theme?: string | null;
  design?: StoredCertificateDesign | null;
  customDocument?: CertificateDocumentV1 | Record<string, unknown> | null;
  presentation?: CertificatePresentationV1 | Record<string, unknown> | null;
  studioDesign?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface CertificateRenderData {
  recipientName: string;
  courseName: string;
  courseDescription: string;
  orgName: string;
  orgLogoUrl?: string;
  date: string;
  certificateId: string;
}

export interface CertificateRenderResult {
  html: string;
  styles: string;
}

export interface CertificateTemplateMeta {
  id: CertificateTemplateId;
  label: string;
  description: string;
}
