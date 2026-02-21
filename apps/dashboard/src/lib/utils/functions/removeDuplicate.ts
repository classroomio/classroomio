export function removeDuplicate(arr) {
  const s = new Set(arr);
  const it = s.values();
  return Array.from(it);
}
