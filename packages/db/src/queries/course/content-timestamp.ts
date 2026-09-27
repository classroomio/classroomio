const STRUCTURAL_FIELDS = new Set(['order', 'sectionId']);

export function contentWriteBumpsTimestamp(fields: readonly string[]) {
  return fields.some((field) => !STRUCTURAL_FIELDS.has(field));
}

export function stampContentUpdatedAt<T extends object>(data: T, updatedAt = new Date().toISOString()) {
  return { ...data, updatedAt };
}
