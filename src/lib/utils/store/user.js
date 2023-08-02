import { writable } from 'svelte/store';

export const user = writable({
  openAuthModal: false,
  fetchingUser: false,
  isLoggedIn: false,
  currentSession: null,
  expiresAt: 0,
});

export const profile = writable({
  id: null,
  fullname: '',
  avatar_url:
    'https://pbs.twimg.com/profile_images/1416443682157473795/dGtFbtht_normal.jpg',
  username: 'Elon',
  user_id: '',
  email: '',
  role: '',
  goal: '',
  source: '',
});
