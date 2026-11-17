import type { MetaTagsProps } from 'svelte-meta-tags';
import { normalizeLandingPageSettings } from '$features/org/utils/landing-page';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import { normalizeVerifyCode } from '@cio/utils/certificate/verify-code';

type VerifyRequest = (typeof classroomio)['org-site']['verify'][':code']['$get'];
type VerifySuccess = Extract<InferResponseType<VerifyRequest>, { success: true }>;

export const load = async (event) => {
  const { parent, url } = event;
  const { org } = await parent();

  const landingSettings = normalizeLandingPageSettings(org?.landingpage);
  const theme = landingSettings.theme ?? 'quartz';
  const navItems = landingSettings.navItems.filter(
    (item) => !item.href.includes('/verify') && item.label.toLowerCase() !== 'verify'
  );

  const raw = url.searchParams.get('code')?.trim() ?? '';
  const normalized = raw ? normalizeVerifyCode(raw) : null;

  let verify: VerifySuccess['data'] | null = null;
  let notFound = false;

  if (raw && !normalized) {
    notFound = true;
  } else if (normalized) {
    let visitorIp: string | undefined;
    try {
      visitorIp = event.getClientAddress?.();
    } catch (error) {
      console.warn('getClientAddress failed', error);
    }

    const result = await safeServerApi<VerifySuccess>(() =>
      classroomio['org-site'].verify[':code'].$get(
        { param: { code: normalized } },
        visitorIp ? { headers: { 'x-visitor-ip': visitorIp } } : undefined
      )
    );
    if (result.ok) {
      verify = result.body.data;
    } else {
      notFound = true;
    }
  }

  const pageMetaTags = Object.freeze({
    title: verify ? `${verify.status} certificate` : raw ? 'Certificate not found' : 'Verify a certificate',
    description: 'Verify a certificate issued by ' + (org?.name ?? 'this organization'),
    robots: 'noindex, nofollow'
  } as MetaTagsProps & { robots: string });

  return {
    org,
    theme,
    navItems,
    footer: landingSettings.footer,
    code: raw,
    normalized,
    verify,
    notFound,
    pageMetaTags
  };
};
