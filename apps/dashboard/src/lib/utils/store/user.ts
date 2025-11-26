import type { TProfile, TUser } from '@cio/db/types';

import { writable } from 'svelte/store';

interface UserStore {
  openAuthModal: boolean;
  fetchingUser: boolean;
  isLoggedIn: boolean;
  currentSession: TUser | undefined;
  expiresAt: number;
}

// Using TProfile type from @cio/utils/types with optional id for store initialization
export type ProfileStore = Omit<TProfile, 'id'> & {
  id: string | undefined;
};

export const defaultUserState: UserStore = {
  openAuthModal: false,
  fetchingUser: true,
  isLoggedIn: false,
  currentSession: undefined,
  expiresAt: 0
};

export const defaultProfileState: TProfile = {
  id: '',
  fullname: '',
  avatarUrl: '',
  username: '',
  email: null,
  role: null,
  goal: null,
  source: null,
  telegramChatId: null,
  locale: 'en',
  isEmailVerified: false,
  verifiedAt: null,
  canAddCourse: true,
  isRestricted: false,
  createdAt: '',
  updatedAt: '',
  metadata: null
};

export const user = writable<UserStore>(defaultUserState);

export const profile = writable<TProfile>(defaultProfileState);
