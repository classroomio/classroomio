export function genQuizPin(): number {
  var minm = 100000;
  var maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}

export function generateSitename(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
}
