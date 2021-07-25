let ENV = process.env;

export const getConfig = (_env) => {
  if (!!_env) {
    ENV = { ...ENV, ..._env };
  }

  return {
    port: ENV.PORT,
    nodeEnv: ENV.NODE_ENV,
    isProd: ENV.NODE_ENV === 'development',
    supabaseConfig: {
      url: ENV.SVELTE_APP_SUPABASE_URL,
      anonKey: ENV.SVELTE_APP_SUPABASE_ANON_KEY,
    },
  };
};
