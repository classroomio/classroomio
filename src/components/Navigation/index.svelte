<script>
  import { goto } from '@sapper/app';
  import { user, profile } from '../../utils/store/user';
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import { VARIANTS } from '../PrimaryButton/constants';

  export let segment;
  export let disableLogin;

  let navClass = '';

  $: navClass = ['discussion'].includes(segment) ? 'hide' : '';
</script>

<nav
  class="{navClass} flex w-full p-2 border-t-0 border-r-0 border-b border-l-0 border-gray-300"
>
  <ul class="flex w-full items-center">
    <div class="logo">
      <a href="/" title="Go to ClassroomIO Home" id="logo" data-hveid="8">
        <img
          src="/logo-192.png"
          alt="ClassroomIO logo"
          class="rounded h-10 w-10 inline-block mx-auto"
          data-atf="1"
        />
      </a>
    </div>

    {#if $user.isLoggedIn}
      <li class="">
        <a
          class="block"
          aria-current={segment === undefined || segment === 'dashboard'
            ? 'page'
            : undefined}
          href="dashboard"
        >
          Dashboard
        </a>
      </li>

      <li>
        <a
          class="block"
          aria-current={segment === 'courses' ? 'page' : undefined}
          href="courses"
        >
          Courses
        </a>
      </li>

      <li class="hidden">
        <a
          class="block"
          aria-current={segment === 'discussions' || segment === 'discussion'
            ? 'page'
            : undefined}
          href="discussions"
        >
          Discussion
        </a>
      </li>

      <li class="hidden">
        <a
          class="block"
          aria-current={segment === 'people' ? 'page' : undefined}
          href="people"
          >People
        </a>
      </li>
    {/if}

    <span class="flex-grow" />

    <li>
      {#if !disableLogin}
        <div class="flex">
          <PrimaryButton
            label="Login"
            variant={VARIANTS.NONE}
            className="py-3 px-6 mx-2 app-background-color"
            onClick={() => goto('/login')}
          />
          <PrimaryButton
            label="Sign Up"
            variant={VARIANTS.CONTAINED}
            className="py-3 px-6 mx-2"
            onClick={() => goto('/signup')}
          />
        </div>
      {/if}
    </li>
    <!-- <li class="hidden">
      <a
        class="flex items-center"
        href="https://t.me/classroomio"
        target="_blank"
      >
        <img
          alt="File:Telegram logo.svg"
          class="mr-1"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/50px-Telegram_alternative_logo.svg.png"
          decoding="async"
          width="25"
          height="25"
          srcset="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/50px-Telegram_alternative_logo.svg.png 1.5x, https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/1024px-Telegram_logo.svg.png 2x"
          data-file-width="25"
          data-file-height="25"
        />
        <span><SendAlt32 class="carbon-icon" /> Канал</span>
        <SendAlt32 class="carbon-icon" />
        <span>Канал</span>
      </a>
    </li> -->
    <!-- <li class="new-question">
      <NewQuestion />
    </li> -->
  </ul>
</nav>

<style>
  ul {
    margin: 0 auto;
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
    color: var(--main-primary-color);
    padding: 0 1.5em;
    font-weight: 700;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  [aria-current] {
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
  }

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
