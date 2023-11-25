export function removeDuplicate(arr) {
  let s = new Set(arr);
  let it = s.values();
  return Array.from(it);
}
