export function isUUID(uuid: string) {
  const s = '' + uuid;

  const m: RegExpMatchArray | null = s.match(
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  );

  if (m === null) {
    return false;
  }

  return true;
}
