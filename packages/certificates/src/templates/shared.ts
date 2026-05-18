import type { CertificateDesign, CertificateRenderData } from '../types';

export function escapeHtml(input: unknown): string {
  return String(input ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function getYear(value: string | undefined | null): string {
  const match = String(value ?? '').match(/\b(19|20|21)\d{2}\b/);
  if (match) return match[0];

  return String(new Date().getFullYear());
}

export function shadeColor(hex: string, percent: number): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return hex;

  const numeric = parseInt(normalized, 16);
  if (Number.isNaN(numeric)) return hex;

  const offset = Math.round((percent / 100) * 255);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const red = clamp(((numeric >> 16) & 0xff) + offset);
  const green = clamp(((numeric >> 8) & 0xff) + offset);
  const blue = clamp((numeric & 0xff) + offset);
  const next = (red << 16) | (green << 8) | blue;

  return '#' + next.toString(16).padStart(6, '0');
}

export interface TemplateRenderArgs {
  design: CertificateDesign;
  data: CertificateRenderData;
}

export interface TemplateRenderOutput {
  body: string;
  styles: string;
}

export type TemplateRenderer = (args: TemplateRenderArgs) => TemplateRenderOutput;

export const FONTS_LINK_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&family=Archivo+Black&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Space+Grotesk:wght@400;500;700&display=swap';

export const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1100px; height: 780px; background: transparent; }
  body { -webkit-font-smoothing: antialiased; }
  .cert { width: 1100px; height: 780px; position: relative; overflow: hidden; }
`;
