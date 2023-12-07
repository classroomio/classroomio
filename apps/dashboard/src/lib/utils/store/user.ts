import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

interface UserStore {
  openAuthModal: boolean;
  fetchingUser: boolean;
  isLoggedIn: boolean;
  currentSession: User | undefined;
  expiresAt: number;
}

interface ProfileStore {
  id: string | undefined;
  fullname: string;
  avatar_url: string;
  profile_url?: string;
  username: string;
  user_id: string;
  email: string;
  role: string;
  goal: string;
  source: string;
  telegram_chat_id: number | null;
}

export const defaultUserState: UserStore = {
  openAuthModal: false,
  fetchingUser: false,
  isLoggedIn: false,
  currentSession: undefined,
  expiresAt: 0
};

export const defaultProfileState: ProfileStore = {
  id: undefined,
  fullname: '',
  avatar_url: 'https://pbs.twimg.com/profile_images/1416443682157473795/dGtFbtht_normal.jpg',
  username: 'Elon',
  user_id: '',
  email: '',
  role: '',
  goal: '',
  source: '',
  telegram_chat_id: null
};

export const user = writable<UserStore>(defaultUserState);

export const profile = writable<ProfileStore>(defaultProfileState);
