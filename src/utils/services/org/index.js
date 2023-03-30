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

export async function createNewOrg(orgName, siteName, profileId, errors = {}) {
  const { data: org, error } = await supabase.from('organization').insert({
    name: orgName,
    siteName: siteName,
  });
  console.log('Create organisation', org);
  if (error) {
    console.log('Error: create organisation', error);
    errors.siteName = 'Sitename already exists.';
    return;
  }

  if (Array.isArray(org) && org.length) {
    const orgData = org[0];
    const { data, error } = await supabase.from('organizationmember').insert({
      organization_id: orgData.id,
      profile_id: profileId,
      role_id: 1,
    });
    console.log('Create organisation member', data);

    orgs.update((o) => [...o, orgData]);
    currentOrg.set(orgData);

    if (error) {
      console.log('Error: create organisation member', error);
      errors.siteName =
        'Something went wrong while creating this organization. Please reload and try again';

      // Delete organization so it can be recreated.
      await supabase
        .from('organization')
        .delete()
        .match({ siteName: siteName });
      return;
    }
  }
}
