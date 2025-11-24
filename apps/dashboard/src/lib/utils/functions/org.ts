import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export function genQuizPin(): number {
  const minm = 100000;
  const maxm = 999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}

export function generateSitename(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
}

export function openUpgradeModal() {
  const url = new URL(window.location.href);

  url.searchParams.set('upgrade', 'true');

  const searchParams = url.searchParams.toString();

  goto(resolve(window.location.pathname + `?${searchParams}`, {}));
}

export function getShortOrgName(name: string) {
  return name?.substring(0, 2)?.toUpperCase() || '';
}
