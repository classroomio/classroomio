import type { Profile, User } from '@cio/utils/types';

import { LOCALE } from '../types';
import { writable } from 'svelte/store';

interface UserStore {
  openAuthModal: boolean;
  fetchingUser: boolean;
  isLoggedIn: boolean;
  currentSession: User | undefined;
  expiresAt: number;
}

// Using Profile type from @cio/utils/types with optional id for store initialization
export type ProfileStore = Omit<Profile, 'id'> & {
  id: string | undefined;
};

export const defaultUserState: UserStore = {
  openAuthModal: false,
  fetchingUser: true,
  isLoggedIn: false,
  currentSession: undefined,
  expiresAt: 0
};

export const defaultProfileState: Profile = {
  id: '',
  fullname: '',
  avatarUrl: '',
  username: '',
  email: null,
  role: null,
  goal: null,
  source: null,
  telegramChatId: null,
  locale: LOCALE.EN,
  isEmailVerified: false,
  verifiedAt: null,
  canAddCourse: true,
  isRestricted: false,
  createdAt: '',
  updatedAt: '',
  metadata: null
};

export const user = writable<UserStore>(defaultUserState);

export const profile = writable<Profile>(defaultProfileState);
