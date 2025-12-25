<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    disableSignup?: boolean;
    redirect?: string;
    isMobile?: boolean;
    onMobileClick?: (() => void) | undefined;
  }

  let { disableSignup = false, redirect = '', isMobile = false, onMobileClick = undefined }: Props = $props();
</script>

<div class="flex {isMobile ? 'flex-col items-center justify-center space-y-3' : ''}">
  <li class={isMobile ? '' : 'block'}>
    <div class="flex">
      <Button variant="link" size="sm" href={'/login' + redirect} onclick={onMobileClick}>
        {$t('navigation.login')}
      </Button>
    </div>
  </li>

  {#if !disableSignup}
    <li class={isMobile ? '' : 'block'}>
      <div class="flex">
        <Button variant="link" size="sm" href={'/signup' + redirect} onclick={onMobileClick}>
          {$t('navigation.signup')}
        </Button>
      </div>
    </li>
  {/if}
</div>
