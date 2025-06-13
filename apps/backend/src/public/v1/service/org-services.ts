import { getSupabase } from '$src/utils/supabase';
import { TOrganizationUpdate, ZOrganizationUpdate } from '$src/public/utils/validations';

const supabase = getSupabase();

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  try {
    const { data, error } = await supabase
      .from('organization')
      .select('id, name, siteName, avatar_url, landingpage, created_at')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error getting organization:', error);
      return null;
    }
    return data as Organization;
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
}

export async function updateOrganization(
  organizationId: string,
  updates: TOrganizationUpdate
): Promise<Organization | null> {
  try {
    const validatedUpdates = ZOrganizationUpdate.parse(updates);
    const { data, error } = await supabase
      .from('organization')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return null;
    }
    return data as Organization;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}
