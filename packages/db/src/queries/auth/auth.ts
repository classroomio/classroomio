import { customSession } from 'better-auth/plugins';
import { getProfileById } from './profile';
import { getOrganizationByProfileId } from '../organization';

export const getCustomSession = () =>
  customSession(async ({ user, session }) => {
    const profile = await getProfileById(user.id);
    const organizations = await getOrganizationByProfileId(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      profile,
      session,
      organizations
    };
  });
