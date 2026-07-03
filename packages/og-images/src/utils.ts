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

export function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

export function orgInitials(orgName: string): string {
  const words = orgName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
  }

  return orgName.trim().slice(0, 2).toUpperCase();
}

export function shadeColor(hex: string, percent: number): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) {
    return hex;
  }

  const numeric = parseInt(normalized, 16);
  if (Number.isNaN(numeric)) {
    return hex;
  }

  const offset = Math.round((percent / 100) * 255);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const red = clamp(((numeric >> 16) & 0xff) + offset);
  const green = clamp(((numeric >> 8) & 0xff) + offset);
  const blue = clamp((numeric & 0xff) + offset);
  const next = (red << 16) | (green << 8) | blue;

  return `#${next.toString(16).padStart(6, '0')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads a public-facing tagline from raw org `landingpage` JSON without
 * depending on dashboard normalization helpers.
 */
export function extractOrgTagline(landingpage: unknown): string | undefined {
  if (!isRecord(landingpage)) {
    return undefined;
  }

  const footer = landingpage.footer;
  if (isRecord(footer)) {
    const brand = footer.brand;
    if (isRecord(brand) && typeof brand.tagline === 'string') {
      const footerTagline = brand.tagline.trim();
      if (footerTagline) {
        return footerTagline;
      }
    }
  }

  const hero = landingpage.hero;
  if (isRecord(hero) && typeof hero.subheading === 'string') {
    const subheading = hero.subheading.trim();
    if (subheading) {
      return subheading;
    }
  }

  return undefined;
}
