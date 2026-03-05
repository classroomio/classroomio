/**
 * If multiple questions have order 0 (or null), they are considered unordered.
 * Normalizes by sorting by id and assigning incrementing order values.
 * Returns questions with order set; original array is not mutated.
 */
export function normalizeQuestionOrder<T extends { id?: number | string; order?: number | null }>(questions: T[]): T[] {
  if (questions.length === 0) return questions;

  const withOrderZero = questions.filter((q) => q.order == null || q.order === 0);
  const isUnordered = withOrderZero.length > 1;

  const toNumericId = (id: number | string | undefined): number =>
    typeof id === 'number' ? id : typeof id === 'string' ? parseInt(id, 10) || 0 : 0;

  if (!isUnordered) {
    return [...questions].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return toNumericId(a.id) - toNumericId(b.id);
    });
  }

  const sortedById = [...questions].sort((a, b) => toNumericId(a.id) - toNumericId(b.id));
  return sortedById.map((q, index) => ({ ...q, order: index + 1 }));
}
