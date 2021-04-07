<script>
  import NewQuestion from "./NewQuestion.svelte";
  import Home32 from "carbon-icons-svelte/lib/Home32";
  import SendAlt32 from "carbon-icons-svelte/lib/SendAlt32";
  import UserAvatar32 from "carbon-icons-svelte/lib/UserAvatar32";
  import Calendar32 from "carbon-icons-svelte/lib/Calendar32";
  export let segment;
  let navClass = "";

  $: navClass = ["discussion"].includes(segment) ? "hide" : "";
</script>

<nav class={navClass}>
  <ul class="flex items-start flex-col justify-evenly">
    <div class="logo">
      <a href="/" title="Go to univapros Home" id="logo" data-hveid="8"
        ><img
          src="/logo-192.png"
          alt="Univapros logo"
          height="48"
          width="48"
          data-atf="1"
        /></a
      >
    </div>
    <li>
      <a
        class="block"
        aria-current={segment === undefined || segment === "discussion"
          ? "page"
          : undefined}
        href="."><Home32 class="carbon-icon" /><span>Home</span></a
      >
    </li>
    <li>
      <a
        class="block"
        aria-current={segment === "profile" ? "page" : undefined}
        href="profile"
        ><UserAvatar32 class="carbon-icon" /> <span>Профиль</span></a
      >
    </li>
    <li>
      <a
        class="block"
        aria-current={segment === "timetable" ? "page" : undefined}
        href="timetable"
        ><Calendar32 class="carbon-icon" /> <span>Расписание</span></a
      >
    </li>
    <li>
      <a
        class="flex items-center"
        href="https://t.me/unidiscuss"
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
        <SendAlt32 class="carbon-icon" /> <span>Канал</span>
      </a>
    </li>
    <li class="new-question">
      <NewQuestion />
    </li>
  </ul>
</nav>

<style>
  nav {
    height: 100vh;
    display: flex;
    flex-direction: column;
    width: 20%;
    padding-top: 10px;
    position: sticky;
    top: 0;
  }

  ul {
    margin: 0 auto;
    padding: 0;
  }

  /* clearfix */
  ul::after {
    content: "";
    display: block;
    clear: both;
  }

  li.new-question {
    margin-top: 10px;
  }

  a {
    text-decoration: none;
    padding: 1em 0.5em;
    font-weight: 700;
    display: flex;
    align-items: center;
  }

  :global(svg.carbon-icon) {
    margin-right: 10px;
  }

  [aria-current] :global(svg.carbon-icon) {
    fill: #3182ce;
  }

  [aria-current] {
    color: #3182ce;
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
