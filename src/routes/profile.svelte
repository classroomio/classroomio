<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { getSupabase } from '../utils/functions/supabase';
  import { user, profile } from '../utils/store/user';

  export let config;

  let supabase = getSupabase(config);
  let loading = true;
  let username = null;
  let website = null;
  let avatar_url = null;

  async function updateProfile() {
    try {
      loading = true;
      const user = supabase.auth.user();

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      let { error } = await supabase.from('profiles').upsert(updates, {
        returning: 'minimal', // Don't return the value after inserting
      });

      if (error) throw error;
    } catch (error) {
      alert(error.message);
    } finally {
      loading = false;
    }
  }
</script>

<form class="form-widget" on:submit|preventDefault={updateProfile}>
  <div>
    <label for="email">Email</label>
    <input id="email" type="text" value={$user.email} disabled />
  </div>
  <div>
    <label for="username">Name</label>
    <input id="username" type="text" bind:value={username} />
  </div>
  <div>
    <label for="website">Website</label>
    <input id="website" type="website" bind:value={website} />
  </div>

  <div>
    <input
      type="submit"
      class="button block primary"
      value={loading ? 'Loading ...' : 'Update'}
      disabled={loading}
    />
  </div>
</form>
