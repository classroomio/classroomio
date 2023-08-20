<script>
  import { goto } from '$app/navigation';
  import UserAvatarIcon from 'carbon-icons-svelte/lib/UserAvatar.svelte';
  import BookIcon from 'carbon-icons-svelte/lib/Book.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { user, profile } from '$lib/utils/store/user';

  export let data;
  const { profileId } = data;

  let avatar;
  let loading = false;
  let currentProfile = {};
  let isOwner = false;
  let initialValueOfUserName, initialValueOfFullName, initialValueOfAvatar;

  async function getProfile(profileId) {
    loading = true;
    // Get user profile

    // Check if user has profile
    let {
      data: profileData,
      error,
      status
    } = await supabase.from('profile').select(`*`).eq('id', profileId).single();

    if (error && !profileData && status === 406 && $user.currentSession) {
      // Not found
    } else if (profileData) {
      // Profile exists, go to profile page
      currentProfile = profileData;
      initialValueOfUserName = currentProfile.username;
      initialValueOfFullName = currentProfile.fullname;
    }

    loading = false;
  }

  async function updateProfile() {
    try {
      loading = true;

      const updates = {
        fullname: currentProfile.fullname,
        username: currentProfile.username
      };

      if (avatar) {
        const filename = `user/${currentProfile.username + Date.now()}.webp`;

        const { data } = await supabase.storage.from('avatars').upload(filename, avatar, {
          cacheControl: '3600',
          upsert: false
        });

        if (data && data.Key) {
          const { publicURL } = supabase.storage.from('avatars').getPublicUrl(filename);

          updates.avatar_url = publicURL;
          currentProfile.avatar_url = publicURL;
        }
        avatar = undefined;
      }

      let { error } = await supabase.from('profile').update(updates).match({ id: profileId });

      if (isOwner) {
        profile.update((_profile) => ({
          ..._profile,
          ...updates
        }));
      }

      if (error) throw error;
    } catch (error) {
      alert(error.message);
      loading = false;
    } finally {
      loading = false;

      initialValueOfUserName = currentProfile.username;
      initialValueOfFullName = currentProfile.fullname;
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.log('error logout', error);
    goto('/login');
  }

  $: isDirty =
    avatar ||
    initialValueOfUserName !== currentProfile.username ||
    initialValueOfFullName !== currentProfile.fullname;
  $: isOwner = $profile.id === profileId;
  $: getProfile(profileId);

  $: if (avatar) {
    updateProfile();
  }
</script>

<svelte:head>
  <title>Profile of {currentProfile.username}</title>
</svelte:head>

<section class="root w-11/12 mt-3 m-auto flex items-start justify-between flex-col lg:flex-row">
  {#if currentProfile.id}
    <div class="w-full lg:w-1/4 flex items-center flex-col">
      <!-- <img
        alt={currentProfile.username}
        src={currentProfile.avatar_url}
        height="260"
        width="260"
        class="rounded-full bg-primary-100 mb-4"
      /> -->
      <UploadImage bind:avatar src={currentProfile.avatar_url} widthHeight="w-60 h-60" />

      {#if isOwner}
        <TextField
          label="Full name"
          bind:value={currentProfile.fullname}
          className="w-60 mb-4"
          inputClassName="rounded-md"
        />
        <TextField
          label="Username"
          bind:value={currentProfile.username}
          className="w-60 mb-4"
          inputClassName="rounded-md"
        />
        <TextField
          label="Email"
          bind:value={currentProfile.email}
          className="w-60 mb-4"
          inputClassName="rounded-md"
          isDisabled={true}
        />

        {#if isDirty}
          <PrimaryButton
            label={loading ? 'Updating...' : 'Update profile'}
            onClick={updateProfile}
            isDisabled={loading}
          />
        {/if}
      {:else}
        <h3 class="dark:text-white text-xl">{currentProfile.username}</h3>
      {/if}
    </div>

    <div class="flex-grow" />
    <div class="flex-grow flex flex-wrap mx-3 w-3/5">
      <div class="mb-3 w-full">
        <h3 class="dark:text-white font-bold text-md m-0">Organizations</h3>
        <p class="dark:text-white text-gray-500 text-sm">This are the organizations you work at</p>

        <div class="hidden my-3 py-3 px-4 border shadow-sm rounded-md">
          <h4 class="dark:text-white m-0 font-normal">
            <a class="text-primary-700 font-bold" href="/courses"> CitiBim </a>
          </h4>
          <p class="dark:text-white text-gray-500">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Non aliquam tenetur magnam.
            Alias cumque quaerat expedita dolores placeat laboriosam culpa, suscipit veritatis
            adipisci eius magni obcaecati. Sequi doloremque blanditiis earum.
          </p>
          <div class="mt-2 flex items-center">
            <span class="flex mr-2 items-center">
              <UserAvatarIcon size={16} class="mr-2" /> 5
            </span>

            <span class="flex mr-2 items-center">
              <BookIcon size={16} class="mr-2" /> 5
            </span>
          </div>
        </div>

        <div class="hidden my-2 py-3 px-4 border shadow-sm rounded-md">
          <h4 class="dark:text-white m-0 font-normal">
            <a class="text-primary-700 font-bold" href="/courses"> Climate Change Group </a>
          </h4>
          <p class="dark:text-white text-gray-500">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Illo quasi autem quo possimus
            illum consequuntur repudiandae nobis error, porro
          </p>
          <div class="mt-2 flex items-center">
            <span class="flex mr-2 items-center">
              <UserAvatarIcon size={16} class="mr-2" /> 30
            </span>

            <span class="flex mr-2 items-center">
              <BookIcon size={16} class="mr-2" /> 3
            </span>
          </div>
        </div>
      </div>
      <PrimaryButton variant={VARIANTS.OUTLINED} label="Log out" onClick={logout} />
    </div>
    <!-- {:else if loading}
    <Box>
      <Chasing size="60" color="#ff3e00" unit="px" duration="1s" />
    </Box>
  {:else}
    <Box>
      <div>
        <Search32 />
      </div>
      <h3 class="dark:text-white text-xxl">Profile not found</h3>
    </Box> -->
  {/if}
</section>

<style>
  .root {
    max-width: 1204px;
  }
</style>
