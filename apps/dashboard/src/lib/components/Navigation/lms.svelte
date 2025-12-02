<script lang="ts">
  import { page } from '$app/state';
  import BellIcon from '@lucide/svelte/icons/bell';
  import * as Avatar from '@cio/ui/base/avatar';

  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { shortenName } from '$lib/utils/functions/string';

  interface Props {
    navClass?: string;
  }

  let { navClass = '' }: Props = $props();
</script>

<nav class="{navClass} bg-primary-700 flex h-[48px] w-full p-2 md:px-6">
  <ul class="flex w-full items-center">
    <div class="">
      <a href={page.url.pathname} title={$t('navigation.goto_home')} id="logo" class="flex items-center text-lg">
        <Avatar.Root class="mr-2 h-7 w-7 rounded-md">
          <Avatar.Image
            src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : '/logo-192.png'}
            alt={$currentOrg.name ? $currentOrg.name : 'Organization'}
          />
          <Avatar.Fallback>{shortenName($currentOrg.name)}</Avatar.Fallback>
        </Avatar.Root>
        <span class="line-clamp-1">
          {$currentOrg.name}
        </span>
      </a>
    </div>

    <span class="flex-grow"></span>

    <li>
      <BellIcon class="text-white" size={16} />
    </li>
    <li></li>
  </ul>
</nav>

<style>
  ul {
    padding: 0;
  }

  /* clearfix */
  ul::after {
    content: '';
    display: block;
    clear: both;
  }

  /* li.new-question {
    margin-top: 10px;
  } */

  a {
    text-decoration: none;
    color: #fff;
    font-weight: 700;
  }

  /* [aria-current] {
    color: var(--main-primary-color);
    position: relative;
    display: inline-block;
  }
  [aria-current]::after {
    position: absolute;
    content: '';
    width: calc(100% - 3em);
    height: 2px;
    background-color: var(--main-primary-color);
    display: block;
    bottom: -17px;
  } */

  @media only screen and (max-width: 1002px) {
    nav.hide {
      display: none;
    }
    ul {
      align-items: center;
    }

    a {
      padding: 0 0.5em;
    }
  }
</style>
