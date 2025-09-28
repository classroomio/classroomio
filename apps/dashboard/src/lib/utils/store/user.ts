import { LOCALE } from '../types';
import type { User } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

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
  locale: LOCALE;
  is_email_verified: boolean;
  verified_at: string;
}

export const defaultUserState: UserStore = {
  openAuthModal: false,
  fetchingUser: true,
  isLoggedIn: false,
  currentSession: undefined,
  expiresAt: 0
};

export const defaultProfileState: ProfileStore = {
  id: undefined,
  fullname: '',
  avatar_url: '',
  username: '',
  user_id: '',
  email: '',
  role: '',
  goal: '',
  source: '',
  telegram_chat_id: null,
  locale: LOCALE.EN,
  is_email_verified: false,
  verified_at: ''
};

export const user = writable<UserStore>(defaultUserState);

export const profile = writable<ProfileStore>(defaultProfileState);
