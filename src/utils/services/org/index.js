import { supabase } from '../../functions/supabase';
import { orgs, currentOrg } from '../../store/org';

export async function getOrganizations(userId) {
  const { data, error } = await supabase
    .from('organizationmember')
    .select(
      `
      id,
      profile_id,
      organization (
        id,
        name,
        siteName
      )
    `
    )
    .eq('profile_id', userId);

  const orgsArray = [];
  if (data.length) {
    data.forEach((orgMember) => {
      orgsArray.push({
        id: orgMember?.organization?.id,
        name: orgMember?.organization?.name,
        siteName: orgMember?.organization?.siteName,
      });
    });

    orgs.set(orgsArray);
    currentOrg.set(orgsArray[0]);
  }

  return {
    orgs: orgsArray,
    currentOrg: orgsArray[0],
    error,
  };
}
