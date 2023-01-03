<script>
  import NotificationIcon from 'carbon-icons-svelte/lib/Notification20';
  import Avatar from '../Avatar/index.svelte';
  import { user, profile } from '../../utils/store/user';

  export let segment;
  export let navClass = '';
</script>

<nav class="{navClass} flex w-full p-2 md:px-6 bg-blue-600">
  <ul class="flex w-full items-center">
    <div class="">
      <a href="/" title="Go to ClassroomIO Home" id="logo" class="text-lg">
        ClassroomIO
      </a>
    </div>

    <span class="flex-grow" />

    <li>
      <NotificationIcon class="text-white mr-2" />
    </li>
    <li>
      {#if $user.isLoggedIn}
        <a
          class="block"
          aria-current={segment === 'profile' ? 'page' : undefined}
          href={`/profile/${$profile.id}`}
        >
          <Avatar
            src={$profile.avatar_url}
            name={$profile.username}
            width="w-7"
            height="h-7"
          />
        </a>
      {/if}
    </li>
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
