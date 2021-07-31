export default {
  // isProd: process.env.NODE_ENV === 'development',
  supabaseConfig: {
    url: process.env.SVELTE_APP_SUPABASE_URL,
    anonKey: process.env.SVELTE_APP_SUPABASE_ANON_KEY,
  },
};
