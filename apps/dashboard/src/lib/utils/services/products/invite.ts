// can be called on server and client
// does not have state management.
// a collection of simple, reusable functions.

import type { Groupmember, ProductInvite, ProductInviteItem } from '$lib/utils/types';
import {
  executeSupabaseQuery,
  handleBatchSupabaseErrors
} from '$lib/utils/functions/supabaseErrorHandler';
import { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';
import { NOTIFICATION_NAME, triggerSendEmail } from '$lib/utils/services/notification';
import type { CurrentOrg } from '$lib/utils/types/org';
import { ROLE } from '$lib/utils/constants/roles';
import { ORG_ROLE } from '$lib/utils/constants/org/role';
import { getSupabase } from '$lib/utils/functions/supabase';

const EXPIRATION = 2 * 60 * 60 * 1000; // 2 hours
let supabase = getSupabase();

class ProductInviteService {
  invite: ProductInvite | undefined;
  _supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this._supabase = supabase;
  }

  async sendInvite(
    params: {
      email: string;
      items: {
        productName: string;
        type: ProductInviteItem['type'];
        groupId: string;
      }[];
    }[],
    org: Pick<CurrentOrg, 'id' | 'name' | 'siteName'>,
    fetch?: typeof window.fetch
  ): Promise<
    | {
        invitations: ProductInvite[];
        groupmembers: Groupmember[];
      }
    | undefined
  > {
    const groupmembers: Groupmember[] = [];
    const invitations: ProductInvite[] = [];

    for (const param of params) {
      const newGroupmember = param.items.map((item) => ({
        email: param.email,
        group_id: item.groupId,
        role_id: ROLE.STUDENT
      }));

      const groupmember = await executeSupabaseQuery<Groupmember[]>(
        () => this._supabase.from('groupmember').insert(newGroupmember).select(),
        'assign user to group'
      );

      if (!groupmember || !groupmember.length) return;

      groupmembers.push(...groupmember);

      const newInvite = await this.createInvite({
        email: param.email,
        organization_id: org.id,
        items: param.items.map((item) => ({
          type: item.type,
          product_name: item.productName,
          group_id: item.groupId
        })),
        expires_at: new Date(Date.now() + EXPIRATION).toISOString()
      });

      if (!newInvite) {
        if (invitations.length) {
          await Promise.all(invitations.map((invite) => this.deleteInvite(invite.id)));
        }

        return;
      }

      invitations.push(newInvite);
    }

    triggerSendEmail(
      NOTIFICATION_NAME.INVITE_STUDENT_TO_PRODUCT,
      {
        org: {
          name: org.name,
          siteName: org.siteName
        },
        invites: invitations.map((invite) => ({
          id: invite.id,
          email: invite.email,
          products: this.getProductNames(invite)
        }))
      },
      {
        fetch
      }
    );

    return {
      invitations,
      groupmembers
    };
  }

  async createInvite(params: Omit<ProductInvite, 'id' | 'created_at' | 'accepted_at'>) {
    const invite = await executeSupabaseQuery<ProductInvite>(
      () => this._supabase.from('product_invite').insert(params).select().single(),
      'create invite'
    );

    if (invite) {
      this.invite = invite;
    }

    return this.invite;
  }

  async getInvite(id: string) {
    const data = await executeSupabaseQuery<ProductInvite>(
      () =>
        this._supabase
          .from('product_invite')
          .select('*, organization!inner(id, name, siteName)')
          .eq('id', id)
          .single(),
      'get invite'
    );

    if (data) {
      this.invite = data;
    }

    return this.invite;
  }

  async deleteInvite(id: string) {
    const data = await executeSupabaseQuery<ProductInvite>(
      () => this._supabase.from('product_invite').delete().eq('id', id),
      'delete invite'
    );

    return data;
  }

  async acceptInvite(
    id: string,
    profileId: string,
    params?: { fetch?: typeof window.fetch; headers?: Record<string, string> }
  ) {
    const invite = await this.getInvite(id);

    if (!invite) {
      throw new Error('Invite not found');
    }

    const requests: any[] = [];

    for (const item of invite.items) {
      requests.push(
        this._supabase
          .from('groupmember')
          .update({
            profile_id: profileId
          })
          .eq('email', invite.email)
          .eq('group_id', item.group_id)
          .select()
          .single()
      );
    }

    const responses = await Promise.all(requests);
    handleBatchSupabaseErrors(responses, 'update user account');

    await executeSupabaseQuery<ProductInvite>(
      () =>
        this._supabase
          .from('product_invite')
          .update({ accepted_at: new Date().toISOString() })
          .eq('id', id),
      'accept invite'
    );

    const profileRes = await supabase
      .from('profile')
      .update({
        is_email_verified: true,
        verified_at: new Date().toDateString()
      })
      .eq('id', id)
      .select();

    console.log('profileRes', profileRes);

    if (profileRes.error) {
      console.error('Error updating profile:', profileRes.error);
    }

    triggerSendEmail(
      NOTIFICATION_NAME.INVITE_STUDENT_TO_PRODUCT_COMPLETE,
      {
        inviteId: id
      },
      params
    );

    return true;
  }

  async getOrgRoleId(roleId: number, orgId: string) {
    let appName;
    switch (roleId) {
      case 1:
        appName = ORG_ROLE.ADMIN;
        break;
      case 2:
        appName = ORG_ROLE.TUTOR;
        break;
      case 3:
        appName = ORG_ROLE.STUDENT;
        break;
      default:
        // Handle unsupported roleId
        console.warn(`Unsupported roleId provided: ${roleId}`);
        // You might want to throw an error here depending on your application's needs
        throw new Error(`Unsupported roleId: ${roleId}. Must be 1, 2, or 3.`);
    }

    const { data, error } = await this._supabase
      .from('organization_role')
      .select('id')
      .eq('organization_id', orgId)
      .eq('app_name', appName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Specific Supabase error for 'no rows found for single()'
        console.warn(
          `No organization_role found for organization_id: ${orgId} and app_name: ${appName}`
        );
        return null;
      }
      // General query error
      console.error('Error fetching org_role_id:', error);
      throw new Error(`Failed to fetch org_role_id: ${error.message}`);
    }

    // If data is null (meaning no matching role), return null
    if (!data) {
      return null;
    }

    // Return the found org_role_id
    return data.id;
  }

  async getGroupmembers(groupIds: string[], includedRoles: number[]) {
    const {
      data,
      error
    }: PostgrestSingleResponse<
      {
        id: string;
        group_id: string;
        profile: {
          fullname: string;
          email: string;
        };
      }[]
    > = await this._supabase
      .from('groupmember')
      .select(
        `
        id,
        group_id,
        profile!inner(
          fullname,
          email
        )
      `
      )
      .in('group_id', groupIds)
      .in('role_id', includedRoles);

    if (error) {
      console.error('Error geting groupmembers', error);
      return [];
    }

    return data || [];
  }

  getProductNames(invite: ProductInvite) {
    return invite.items.map((item) => item.product_name.trim());
  }
}

export { ProductInviteService };
