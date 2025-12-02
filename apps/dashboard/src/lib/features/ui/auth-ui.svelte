<script lang="ts">
  import { page } from '$app/state';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import GoogleIconColored from '$lib/components/Icons/GoogleIconColored.svelte';
  import { authClient } from '$lib/utils/services/auth/client';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { ROUTE } from '$lib/utils/constants/routes';

  interface Props {
    isLogin?: boolean;
    showOnlyContent?: boolean;
    isLoading?: boolean;
    showLogo?: boolean;
    hideGoogleAuth?: boolean;
    redirectPathname?: string;
    handleSubmit?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    isLogin = true,
    showOnlyContent = false,
    isLoading = false,
    showLogo = false,
    hideGoogleAuth = false,
    redirectPathname = '',
    handleSubmit = () => {},
    children
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
</script>

<div class="flex min-h-screen w-full items-center justify-center p-4">
  <Card.Root class="ui:w-full max-w-[400px]">
    {#if !showOnlyContent || showLogo}
      <Card.Header class="ui:flex ui:flex-col ui:items-center ui:gap-4">
        <Avatar
          src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : '/logo-192.png'}
          name={$currentOrg.name ? $currentOrg.name : 'ClassroomIO'}
          shape="rounded-md"
          width="w-10"
          height="max-h-10"
          className="mr-2"
        />
        <a href="/">
          <Card.Title class="ui:text-2xl ui:font-bold">
            {isLogin ? $t('login.welcome') : $t('login.create_account')}
          </Card.Title>
        </a>
        {#if isLogin}
          <Card.Description class="ui:text-center">Sign in to continue</Card.Description>
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
          <Button variant="outline" onclick={signInWithGoogle} disabled={isLoading} class="w-full">
            <GoogleIconColored />
            <span>
              {isLogin ? $t('login.login_with_google') : $t('login.signup_with_google')}
            </span>
          </Button>
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
