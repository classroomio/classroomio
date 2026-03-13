export type GenerateSlugOptions = {
  fallback?: string;
  appendTimestamp?: boolean;
};

export function generateSlug(source: string | null | undefined, options: GenerateSlugOptions = {}): string {
  const { fallback = 'item', appendTimestamp = false } = options;

  const base =
    (source ?? fallback)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || fallback;

  return appendTimestamp ? `${base}-${Date.now()}` : base;
}
