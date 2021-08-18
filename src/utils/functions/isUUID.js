export function isUUID(uuid) {
  let s = '' + uuid;

  s = s.match(
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  );
  if (s === null) {
    return false;
  }
  return true;
}
