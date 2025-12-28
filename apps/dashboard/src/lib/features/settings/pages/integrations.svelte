<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  // import { snackbar } from '$lib/components/Snackbar/store';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { ArrowTopRight, CircleCheckIcon } from '$features/ui/icons';
  import * as Field from '@cio/ui/base/field';

  let chatId: number | null = $state(null);

  async function addChatId() {
    if (!chatId || `${chatId}`.length < 5) return;

    // TODO: Update profile with telegram chat id

    // if (error) {
    //   console.log(error);
    //   snackbar.error('snackbar.course_settings.error.failed_integration');
    // } else {
    //   $profile.telegramChatId = chatId;
    //   chatId = null;
    //   snackbar.success('snackbar.course_settings.success.successful_integration');
    // }
  }

  async function deleteChatId() {
    // const { error } = await supabase.from('profile').update({ telegram_chat_id: null }).match({ id: $profile.id });
    // if (error) {
    //   snackbar.error('snackbar.course_settings.error.failed_deletion');
    //   console.log(error);
    // } else {
    //   $profile.telegramChatId = null;
    //   snackbar.success('snackbar.course_settings.success.successful_deletion');
    // }
  }
</script>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>
      <img src="/telegram-svg.svg" alt="" class="mr-2 w-10" />
      {$t('settings.integrations.heading')}
    </Field.Legend>
    {#if $profile.telegramChatId !== null}
      <Field.Field>
        <div class="flex items-center">
          <CircleCheckIcon size={16} filled />
          <Field.Description>{$t('settings.integrations.success_message')}</Field.Description>
        </div>
        <Button variant="destructive" onclick={deleteChatId}>
          {$t('settings.integrations.disconnect')}
        </Button>
      </Field.Field>
    {:else}
      <Field.Group>
        <Field.Description>{$t('settings.integrations.sub_heading')}</Field.Description>
        <Field.Description>{$t('settings.integrations.step_authenticate')}</Field.Description>
        <Button variant="outline" onclick={() => window.open('https://t.me/classroomio_bot', '_blank')}>
          <span class="mr-2">{$t('settings.integrations.open_bot_button')}</span>
          <ArrowTopRight />
        </Button>
        <Field.Description>{$t('settings.integrations.step_chatId')}</Field.Description>
        <Field.Field>
          <Input bind:value={chatId} placeholder="360111" class="w-full lg:w-60" type="number" required />
        </Field.Field>
        <Button variant="default" onclick={addChatId}>{$t('settings.integrations.connect_button')}</Button>
      </Field.Group>
    {/if}
  </Field.Set>
</Field.Group>
