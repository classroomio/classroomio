<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import * as Avatar from '@cio/ui/base/avatar';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { GoogleIconColored } from '$features/ui/icons';
  import { authClient } from '$lib/utils/services/auth/client';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { ROUTE } from '$lib/utils/constants/routes';
  import { DotPattern } from '@cio/ui/custom/animation/dot-pattern';

  interface Props {
    isLogin?: boolean;
    showOnlyContent?: boolean;
    isLoading?: boolean;
    showLogo?: boolean;
    hideGoogleAuth?: boolean;
    redirectPathname?: string;
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

    console.log({ redirectTo });

    try {
      console.log('signInWithGoogle');
      const data = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo,
        errorCallbackURL: errorCallbackURL
      });

      console.log('data', data);
    } catch (error) {
      console.log('catch error', error);
    }
  }

  const authBackgroundUrl = $derived($currentOrg.customization.auth?.backgroundImage?.trim() ?? '');
</script>

<div class="auth-ui-background relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
  {#if authBackgroundUrl}
    <div class="absolute inset-0 z-0">
      <img src={authBackgroundUrl} alt="" class="h-full w-full object-cover" decoding="async" />
      <div class="absolute inset-0 bg-black/45" aria-hidden="true"></div>
    </div>
  {:else}
    <DotPattern fillColor="rgb(2 51 189 / 0.25)" class="absolute inset-0 z-0 h-full w-full" />
  {/if}
  <Card.Root class="ui:w-full relative z-10 max-w-[400px] shadow-sm">
    {#if !showOnlyContent || showLogo}
      <Card.Header class="ui:flex ui:flex-col ui:items-center ui:gap-4">
        <Avatar.Root>
          <Avatar.Image
            src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : '/logo-192.png'}
            alt={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
          />
          <Avatar.Fallback>{$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}</Avatar.Fallback>
        </Avatar.Root>

        {#if !showOnlyContent}
          <a href="/">
            <Card.Title class="ui:text-2xl font-normal!">
              {isLogin ? $t('login.welcome') : $t('login.create_account')}
            </Card.Title>
          </a>
          {#if isLogin}
            <Card.Description class="ui:text-center">Sign in to continue</Card.Description>
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
            <span class="ui:bg-card ui:text-muted-foreground absolute px-2 text-sm"> Or continue With </span>
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
        <p class="text-muted-foreground text-center text-sm">
          {#if isLogin}
            {$t('login.not_registered_yet')}
            <a class="text-primary hover:underline" href="/signup{page.url.search}">{$t('login.signup')}</a>
          {:else}
            {$t('login.already_have_account')}
            <a class="text-primary hover:underline" href="/login{page.url.search}">{$t('login.login')}</a>
          {/if}
        </p>
      </Card.Footer>
    {/if}
  </Card.Root>
</div>
