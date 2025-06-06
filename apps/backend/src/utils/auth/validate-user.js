const { getSupabase } = require('../supabase');

const supabase = getSupabase();

const validateUser = async (accessToken) => {
  let user;

  try {
    const { data } = await supabase.auth.getUser(accessToken);

    user = data.user;
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    throw new Error('Unauthenticated user');
  }

  return user;
};

module.exports = {
  validateUser
};
