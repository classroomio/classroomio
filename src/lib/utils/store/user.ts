import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

export const user = writable<{
  openAuthModal: boolean;
  fetchingUser: boolean;
  isLoggedIn: boolean;
  currentSession: User | undefined;
  expiresAt: number;
}>({
  openAuthModal: false,
  fetchingUser: false,
  isLoggedIn: false,
  currentSession: undefined,
  expiresAt: 0
});

export const profile = writable<{
  id: string | number | undefined;
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
}>({
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
});
