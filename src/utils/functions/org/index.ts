export function getOrgAcronym(orgName: string | undefined) {
  if (!orgName) return '';

  const names = orgName?.split(' ');

  if (names.length > 1) {
    const [firstName = '', secondName = ''] = names || [];
    return `${firstName[0]}${secondName[0]}`.toUpperCase();
  }

  const [name = 'DA'] = names || [];
  return `${name[0]}${name[1]}`.toUpperCase() || '';
}
