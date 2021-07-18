<script>
  import Forum32 from 'carbon-icons-svelte/lib/Forum32';
  import SendAlt32 from 'carbon-icons-svelte/lib/SendAlt32';
  import Catalog32 from 'carbon-icons-svelte/lib/Catalog32';
  import UserAvatar32 from 'carbon-icons-svelte/lib/UserAvatar32';
  // import Calendar32 from "carbon-icons-svelte/lib/Calendar32";
  export let segment;
  let navClass = '';

  $: navClass = ['discussion'].includes(segment) ? 'hide' : '';
</script>

<nav class={navClass}>
  <ul class="flex items-center flex-col justify-evenly">
    <div class="logo">
      <a href="/" title="Go to ClassroomIO Home" id="logo" data-hveid="8"
        ><img
          src="/logo-192.png"
          alt="ClassroomIO logo"
          height="70"
          width="70"
          data-atf="1"
        /></a
      >
    </div>
    <li>
      <a
        class="block"
        aria-current={segment === undefined || segment === 'discussion'
          ? 'page'
          : undefined}
        href="."><Forum32 class="carbon-icon" /><span>Discussion</span></a
      >
    </li>
    <li>
      <a
        class="block"
        aria-current={segment === 'courses' ? 'page' : undefined}
        href="courses"
        ><Catalog32 class="carbon-icon" />
        <span>Courses</span></a
      >
    </li>
    <li>
      <a
        class="block"
        aria-current={segment === 'profile' ? 'page' : undefined}
        href="profile"
        ><UserAvatar32 class="carbon-icon" />
        <span>Профиль</span></a
      >
    </li>
    <li>
      <a
        class="flex items-center"
        href="https://t.me/classroomio"
        target="_blank"
      >
        <!-- <img
          alt="File:Telegram logo.svg"
          class="mr-1"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/50px-Telegram_alternative_logo.svg.png"
          decoding="async"
          width="25"
          height="25"
          srcset="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Telegram_alternative_logo.svg/50px-Telegram_alternative_logo.svg.png 1.5x, https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/1024px-Telegram_logo.svg.png 2x"
          data-file-width="25"
          data-file-height="25"
        /> -->
        <!-- <span><SendAlt32 class="carbon-icon" /> Канал</span> -->
        <SendAlt32 class="carbon-icon" />
        <span>Канал</span>
      </a>
    </li>
    <!-- <li class="new-question">
      <NewQuestion />
    </li> -->
  </ul>
</nav>

<style>
  nav {
    height: 90vh;
    display: flex;
    flex-direction: column;
    width: 100px;
    position: sticky;
    top: 0;
    border-right: 1px solid var(--border-color);
  }

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
    padding: 1em 0.5em;
    font-weight: 700;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  [aria-current] {
    color: var(--main-primary-color);
  }

  @media only screen and (max-width: 1002px) {
    nav.hide {
      display: none;
    }
    ul {
      align-items: center;
    }
    li a span {
      display: none;
    }
  }
</style>
