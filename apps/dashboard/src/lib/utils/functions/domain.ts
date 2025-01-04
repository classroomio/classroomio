import { supabase } from '$lib/utils/functions/supabase';

export const sanitizeDomain = (domain: string) => {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0];
};

export async function sendDomainRequest(key: string, domain: string): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token || '';

  return fetch('/api/domain', {
    method: 'POST',
    body: JSON.stringify({ params: { key, domain } }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${accessToken}`
    }
  });
}
