import { User } from 'better-auth';
import { syncProfileEmailVerificationFromAuthUser } from '@db/queries/auth/profile';

export const syncUserWithProfile = async (user: User) => {
  console.log('[auth] syncUserWithProfile: running', { userId: user?.id });

  if (!user?.id) {
    return;
  }

  try {
    await syncProfileEmailVerificationFromAuthUser(user.id);
  } catch (error) {
    console.error('Error syncing profile email verification:', error);
  }
};
