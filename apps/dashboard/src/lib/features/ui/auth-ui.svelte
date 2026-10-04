<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import * as Avatar from '@cio/ui/base/avatar';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { GoogleIconColored } from '$features/ui/icons';
  import { authClient } from '$lib/utils/services/auth/client';
  import { snackbar } from '$features/ui/snackbar/store';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { ROUTE } from '$lib/utils/constants/routes';
  import { BrandWash, MachineTrainingLine } from '@cio/ui/custom/animation';

  interface Props {
    isLogin?: boolean;
    showOnlyContent?: boolean;
    isLoading?: boolean;
    showLogo?: boolean;
    hideGoogleAuth?: boolean;
    redirectPathname?: string;
    newUserCallbackPathname?: string;
    handleSubmit?: () => void;
    children?: Snippet;
    getPasswordAuthAlternative?: Snippet;
  }

  let {
    isLogin = true,
    showOnlyContent = false,
    isLoading = false,
    showLogo = false,
    hideGoogleAuth = false,
    redirectPathname = '',
    newUserCallbackPathname,
    handleSubmit = () => {},
    children,
    getPasswordAuthAlternative
  }: Props = $props();

  async function signInWithGoogle() {
    if (isLoading) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    console.log({ params });
    // const redirectTo = `https://app.classroomio.com?forwardTo=${
    //   window.location.origin + params.get('redirect')
    // }`;
    const pathname = redirectPathname || params.get('redirect') || '';
    const redirectTo = `${window.location.origin + pathname}`;
    const errorCallbackURL = `${window.location.origin + ROUTE.AUTH_FAILED}`;
    const newUserCallbackURL = newUserCallbackPathname
      ? `${window.location.origin}${newUserCallbackPathname}`
      : undefined;

    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo,
        errorCallbackURL,
        ...(newUserCallbackURL ? { newUserCallbackURL } : {})
      });

      if (result?.error) {
        snackbar.error('snackbar.social_auth_not_enabled');
      }
    } catch (error) {
      console.log('catch error', error);
    }
  }

  const authBackgroundUrl = $derived($currentOrg.customization.auth?.backgroundImage?.trim() ?? '');
  const showBlockFooter = $derived(page.data.isOrgSite === false);
</script>

<div
  class="auth-ui-background ui:bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
>
  {#if showBlockFooter}
    <div class="absolute inset-0 z-0 hidden md:block" style:--machine-face="var(--background)">
      <MachineTrainingLine />
    </div>
  {/if}
  {#if authBackgroundUrl}
    <div class="absolute inset-0 z-0">
      <img src={authBackgroundUrl} alt="" class="h-full w-full object-cover" decoding="async" />
      <div class="absolute inset-0 bg-black/45" aria-hidden="true"></div>
    </div>
  {:else}
    <BrandWash />
  {/if}
  <div
    class="relative z-10 w-full max-w-[400px] drop-shadow-[0_10px_20px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
  >
    <Card.Root class="ui:notch-cutout w-full shadow-none">
      {#if !showOnlyContent || showLogo}
        <Card.Header class="flex flex-col items-center gap-4">
          <a
            href={resolve(ROUTE.HOME, {})}
            class="inline-flex"
            aria-label={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
          >
            <Avatar.Root>
              <Avatar.Image
                src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : '/logo-192.png'}
                alt={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
              />
              <Avatar.Fallback>{$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}</Avatar.Fallback>
            </Avatar.Root>
          </a>

          {#if !showOnlyContent}
            <a href="/">
              <Card.Title class="text-2xl font-normal!">
                {isLogin ? $t('login.welcome') : $t('login.create_account')}
              </Card.Title>
            </a>
            {#if isLogin}
              <Card.Description class="text-center">{$t('login.sign_in_to_continue')}</Card.Description>
            {/if}
          {/if}
        </Card.Header>
      {/if}

      <Card.Content>
        <form onsubmit={preventDefault(handleSubmit)}>
          {@render children?.()}
        </form>

        {#if !showOnlyContent && !hideGoogleAuth}
          <div class="mt-6 flex flex-col gap-6">
            <div class="relative flex items-center justify-center">
              <Separator />
              <span class="ui:bg-card ui:text-muted-foreground absolute px-2 text-sm">{$t('login.continue_with')}</span>
            </div>

            {#if getPasswordAuthAlternative}
              {@render getPasswordAuthAlternative()}
            {:else}
              <Button variant="outline" onclick={signInWithGoogle} disabled={isLoading} class="w-full">
                <GoogleIconColored />
                <span>
                  {isLogin ? $t('login.login_with_google') : $t('login.signup_with_google')}
                </span>
              </Button>
            {/if}
          </div>
        {/if}
      </Card.Content>
      {#if !showOnlyContent}
        <Card.Footer class="flex-col gap-2 border-t pt-6">
          <p class="ui:text-muted-foreground text-center text-sm">
            {#if isLogin}
              {$t('login.not_registered_yet')}
              <a class="ui:text-primary hover:underline" href="/signup{page.url.search}">{$t('login.signup')}</a>
            {:else}
              {$t('login.already_have_account')}
              <a class="ui:text-primary hover:underline" href="/login{page.url.search}">{$t('login.login')}</a>
            {/if}
          </p>
        </Card.Footer>
      {/if}
    </Card.Root>
  </div>
</div>
