export function generateSitename(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
}
