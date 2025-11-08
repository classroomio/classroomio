<script lang="ts">
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    disableSignup?: boolean;
    redirect?: string;
    isMobile?: boolean;
    onMobileClick?: (() => void) | undefined;
  }

  let {
    disableSignup = false,
    redirect = '',
    isMobile = false,
    onMobileClick = undefined
  }: Props = $props();

  function handleLogin() {
    if (onMobileClick) onMobileClick();
    goto('/login' + redirect);
  }

  function handleSignup() {
    if (onMobileClick) onMobileClick();
    goto('/signup' + redirect);
  }
</script>

<div class="flex {isMobile ? 'flex-col items-center justify-center space-y-3' : ''}">
  <li class={isMobile ? '' : 'block'}>
    <div class="flex">
      <PrimaryButton
        label={$t('navigation.login')}
        variant={VARIANTS.TEXT}
        onClick={handleLogin}
        className={isMobile ? 'w-full justify-center' : ''}
      />
    </div>
  </li>

  {#if !disableSignup}
    <li class={isMobile ? '' : 'block'}>
      <div class="flex">
        <PrimaryButton
          label={$t('navigation.signup')}
          variant={VARIANTS.CONTAINED}
          onClick={handleSignup}
          className={isMobile ? 'w-full justify-center' : ''}
        />
      </div>
    </li>
  {/if}
</div>
