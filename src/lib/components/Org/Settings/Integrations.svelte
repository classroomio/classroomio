<script lang="ts">
  import { Grid, Column, Row } from 'carbon-components-svelte';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { SNACKBAR_SEVERITY } from '$lib/components/Snackbar/constants';
  import { snackbarStore } from '$lib/components/Snackbar/store';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import SectionTitle from '../SectionTitle.svelte';
  import ArrowUpRightIcon from '$lib/components/Icons/ArrowTopRight.svelte';

  let chatId: number | null;

  async function addChatId() {
    const updates = {
      telegram_chat_id: chatId
    };
    if ($profile.telegram_chat_id === null) {
      let { error } = await supabase.from('profile').update(updates).match({ id: $profile.id });
      // Update the telegram_chat_id in the profile store with the value from the TextField
      profile.update((profileData) => ({
        ...profileData,
        ...updates
      }));
      // Clear the chatId variable after updating the store
      chatId = null;

      if (error) {
        $snackbarStore.open = true;
        $snackbarStore.message = 'Integration Failed, please try again later';
        $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
        console.log(error);
      } else {
        $snackbarStore.open = true;
        $snackbarStore.message = 'Integration successful';
        $snackbarStore.severity = SNACKBAR_SEVERITY.SUCCESS;
      }
    }
  }

  async function deleteChatId() {
    const updates = {
      telegram_chat_id: null
    };
    let { error } = await supabase.from('profile').update(updates).match({ id: $profile.id });
    if (typeof $profile.telegram_chat_id !== null) {
      profile.update((profileData) => ({
        ...profileData,
        telegram_chat_id: null
      }));

      if (error) {
        $snackbarStore.open = true;
        $snackbarStore.message = 'Deletion Failed, please try again later';
        $snackbarStore.severity = SNACKBAR_SEVERITY.ERROR;
        console.log(error);
      } else {
        // Show a success message in the snackbar
        $snackbarStore.open = true;
        $snackbarStore.message = 'Integration deleted';
        $snackbarStore.severity = SNACKBAR_SEVERITY.SUCCESS;
      }
    }
  }
</script>

<Grid class="border-c rounded border-gray-200 w-full mt-5">
  <Row class="flex lg:flex-row flex-col justify-center lg:justify-start py-7 border-bottom-c">
    <Column sm={4} md={4} lg={4} class="flex items-center justify-center">
      <img src="/telegram-svg.svg" alt="" class="w-10 mr-2" />
      <SectionTitle>Telegram</SectionTitle></Column
    >

    <Column sm={8} md={8} lg={8} class="mt-2 lg:mt-0 flex flex-col items-center lg:items-start">
      {#if $profile.telegram_chat_id !== null}
        <div class="flex flex-col items-center w-full">
          <div class="flex items-center">
            <CheckmarkFilled size={32} class="mr-2" style="fill: green;" />
            <SectionTitle>Integration Successful</SectionTitle>
          </div>
          <PrimaryButton className="mt-3" variant={VARIANTS.CONTAINED_DANGER} onClick={deleteChatId}
            >Disconnect</PrimaryButton
          >
        </div>
      {:else}
        <div>
          <h3 class="font-normal text-lg">
            Connect your account to telegram to get notified of any change within the application.
          </h3>
          <h4 class="font-normal">Step 1: Authenticate your account via the ClassroomIO bot.</h4>
          <PrimaryButton
            className="mb-5"
            variant={VARIANTS.OUTLINED}
            onClick={() => window.open('https://t.me/classroomio_bot', '_blank')}
            ><span class="mr-2">Open Bot</span> <ArrowUpRightIcon /></PrimaryButton
          >
          <h4 class="font-normal">Step 2: Enter the Chat ID given to you by the bot.</h4>
          <TextField
            bind:value={chatId}
            placeholder="360111"
            className="w-full lg:w-60 mb-5"
            type="number"
            isRequired
          />
          <PrimaryButton onClick={addChatId}>Connect</PrimaryButton>
        </div>
      {/if}
    </Column>
  </Row>
</Grid>
