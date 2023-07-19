<script>
  import PlayContainer from '../Container.svelte';
  import PlayHeader from '../Header/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';

  const avatars = ['snowball', 'oliver', 'simon', 'cleo', 'mia', 'annie'];

  let pin = '';
  let error;
  let errorUserProfile;
  let isLoading = false;
  let user = {
    avatar: '',
    name: '',
  };

  let step = 'PIN';

  function handlePinSubmit() {
    if (pin.length !== 6) {
      error = 'Pin must be 6 digits';
      return;
    }
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      error = undefined;

      step = 'USER_PROFILE';
    }, 5000);
  }

  function handleUserProfileSubmit() {
    if (!user.name || !user.avatar) {
      errorUserProfile = 'Please select an avatar and enter a nickname';
      return;
    }
    isLoading = true;

    setTimeout(() => {
      isLoading = false;
      errorUserProfile = undefined;

      step = 'WAITING_TO_START';
    }, 5000);
  }
</script>

<PlayContainer>
  <div slot="header">
    <PlayHeader customTitle="ClassroomIO Quiz" showCountDown={false} />
  </div>

  <div
    slot="body"
    class="w-80 m-auto rounded-md bg-white dark:bg-gray-700 py-7 px-5"
  >
    {#if step === 'PIN'}
      <form on:submit|preventDefault={handlePinSubmit}>
        <TextField
          label="Enter quiz pin"
          type="number"
          bind:value={pin}
          placeholder="Quiz Pin"
          className="mb-2"
          labelClassName="font-bold"
          inputClassName="py-4"
          errorMessage={error}
          helperMessage="Pin is a 6 digit number"
          isDisabled={isLoading}
        />

        <PrimaryButton label="Enter" width="w-full" type="submit" {isLoading} />
      </form>
    {:else if step === 'USER_PROFILE'}
      <form on:submit|preventDefault={handleUserProfileSubmit}>
        <div class="mb-3">
          <p class="text-sm font-bold">Select an avatar</p>
          <div class="flex">
            {#each avatars as avatar}
              <button
                class="rounded-full mr-1 {user.avatar === avatar &&
                  'border-2 border-blue-700 px-1'}"
                on:click={() => (user.avatar = avatar)}
                type="button"
              >
                <img
                  src="/images/avatars/{avatar}.svg"
                  alt="avatar"
                  class="w-12 h-12 rounded-full"
                />
              </button>
            {/each}
          </div>
        </div>

        <TextField
          label="Enter a nickname"
          bind:value={user.name}
          labelClassName="font-bold"
          className="mb-3"
          placeholder="Spike"
          isRequired={true}
          errorMessage={errorUserProfile}
        />
        <PrimaryButton
          label="Let's go!"
          width="w-full"
          type="submit"
          {isLoading}
        />
      </form>
    {:else if step === 'WAITING_TO_START'}
      <div class="flex flex-col items-center">
        <img
          src="/images/avatars/{user.avatar}.svg"
          alt="avatar"
          class="w-20 h-20 rounded-full"
        />
        <p class="text-2xl font-extrabold">{user.name}</p>

        <p class="text-lg">You're in. See your nickname on the screen?</p>
      </div>
    {/if}
  </div>
</PlayContainer>
