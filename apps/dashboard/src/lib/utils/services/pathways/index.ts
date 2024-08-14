import { supabase } from '$lib/utils/functions/supabase';
import type { Pathway } from '$lib/utils/types';

export function addPathwayGroupMember(member: any) {
  return supabase.from('groupmember').insert(member).select();
}

export async function updatePathways(
  pathwayId: Pathway['id'],
  avatar: string | undefined,
  pathway: Partial<Pathway>
) {
  if (avatar && pathwayId) {
    const filename = `pathway/${pathwayId + Date.now()}.webp`;

    const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
      cacheControl: '3600',
      upsert: false
    });

    if (data) {
      const { data: response } = supabase.storage.from('avatars').getPublicUrl(filename);

      if (!response.publicUrl) return;

      pathway.logo = response.publicUrl;
    }
  }

  await supabase.from('pathway').update(pathway).match({ id: pathwayId });

  return pathway.logo;
}

export async function deletePathway(pathwayId: Pathway['id']) {
  return await supabase.from('pathway').update({ status: 'DELETED' }).match({ id: pathwayId });
}
