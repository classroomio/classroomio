<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { Button } from '@cio/ui/base/button';

  import { Row, Grid, Column } from './Layout';
  import SectionTitle from '../SectionTitle.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import ArrowUpRightIcon from '$lib/components/Icons/ArrowTopRight.svelte';
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';

  let chatId: number | null = $state(null);

  async function addChatId() {
    if (!chatId || `${chatId}`.length < 5) return;

    const { error } = await supabase
      .from('profile')
      .update({
        telegram_chat_id: chatId
      })
      .match({ id: $profile.id });

    if (error) {
      console.log(error);
      snackbar.error('snackbar.course_settings.error.failed_integration');
    } else {
      $profile.telegramChatId = chatId;
      chatId = null;
      snackbar.success('snackbar.course_settings.success.successful_integration');
    }
  }

  async function deleteChatId() {
    const { error } = await supabase.from('profile').update({ telegram_chat_id: null }).match({ id: $profile.id });

    if (error) {
      snackbar.error('snackbar.course_settings.error.failed_deletion');
      console.log(error);
    } else {
      $profile.telegramChatId = null;
      snackbar.success('snackbar.course_settings.success.successful_deletion');
    }
  }
</script>

<Grid class="mt-5 w-full">
  <Row class="border-bottom-c flex flex-col justify-center py-7 lg:flex-row lg:justify-start">
    <Column sm={4} md={4} lg={4} class="flex items-center justify-center">
      <img src="/telegram-svg.svg" alt="" class="mr-2 w-10" />
      <SectionTitle>{$t('settings.integrations.heading')}</SectionTitle></Column
    >

    <Column sm={8} md={8} lg={8} class="mt-2 flex flex-col items-center lg:mt-0 lg:items-start">
      {#if $profile.telegramChatId !== null}
        <div class="flex w-full flex-col items-center">
          <div class="flex items-center">
            <CircleCheckIcon size={16} filled />
            <SectionTitle>{$t('settings.integrations.success_message')}</SectionTitle>
          </div>
          <Button variant="destructive" onclick={deleteChatId} class="mt-3">
            {$t('settings.integrations.disconnect')}
          </Button>
        </div>
      {:else}
        <div>
          <h3 class="text-lg font-normal">
            {$t('settings.integrations.sub_heading')}
          </h3>
          <h4 class="font-normal">{$t('settings.integrations.step_authenticate')}</h4>
          <Button variant="outline" onclick={() => window.open('https://t.me/classroomio_bot', '_blank')} class="mb-5">
            <span class="mr-2">{$t('settings.integrations.open_bot_button')}</span>
            <ArrowUpRightIcon />
          </Button>
          <h4 class="font-normal">{$t('settings.integrations.step_chatId')}</h4>
          <TextField
            bind:value={chatId}
            placeholder="360111"
            className="w-full lg:w-60 mb-5"
            type="number"
            isRequired
          />
          <Button onclick={addChatId}>
            {$t('settings.integrations.connect_button')}
          </Button>
        </div>
      {/if}
    </Column>
  </Row>
</Grid>
