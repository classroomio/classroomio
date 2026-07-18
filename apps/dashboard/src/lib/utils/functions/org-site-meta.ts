function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type OrgSiteMetaCopy = {
  heading?: string;
  description?: string;
};

export function extractOrgSiteMetaCopy(landingpage: unknown): OrgSiteMetaCopy {
  if (!isRecord(landingpage)) {
    return {};
  }

  const copy: OrgSiteMetaCopy = {};

  const hero = landingpage.hero;
  if (isRecord(hero)) {
    if (typeof hero.heading === 'string') {
      const heading = hero.heading.trim();
      if (heading) {
        copy.heading = heading;
      }
    }

    if (typeof hero.subheading === 'string') {
      const subheading = hero.subheading.trim();
      if (subheading) {
        copy.description = subheading;
      }
    }
  }

  const footer = landingpage.footer;
  if (isRecord(footer)) {
    const brand = footer.brand;
    if (isRecord(brand) && typeof brand.tagline === 'string') {
      const tagline = brand.tagline.trim();
      if (tagline && !copy.description) {
        copy.description = tagline;
      }
    }
  }

  return copy;
}

export function buildOrgSiteTitle(orgName: string, heading?: string): string {
  const trimmedName = orgName.trim();
  const trimmedHeading = heading?.trim();

  if (trimmedHeading) {
    return `${trimmedName} | ${trimmedHeading}`;
  }

  return `${trimmedName} | Learning Platform`;
}
