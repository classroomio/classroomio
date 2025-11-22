<script lang="ts">
  import { goto } from '$app/navigation';
  import BellIcon from '@lucide/svelte/icons/bell';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { ModeSwitcher } from '@cio/ui/base/dark-mode';

  import { IconButton } from '$lib/components/IconButton';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    title?: string;
    navClass?: string;
    isCoursePage?: boolean;
  }

  let { title = $bindable(''), navClass = '', isCoursePage = false }: Props = $props();

  let coursesPath = $derived(
    $globalStore.isOrgSite ? '/lms/mylearning' : isCoursePage ? `${$currentOrgPath}/courses` : $currentOrgPath
  );
</script>

<nav class="{navClass} bg-primary-700 flex h-12 w-full p-1 transition delay-150 duration-300 ease-in-out md:px-4">
  <ul class="flex w-full items-center gap-2">
    <div class="flex items-center text-white">
      {#if isCoursePage}
        <li class="hidden md:block">
          <IconButton onClick={() => goto(coursesPath)}>
            <ArrowLeftIcon size={16} class="custom" />
          </IconButton>
        </li>
      {/if}
      <a
        href={coursesPath}
        title="{$t('navigation.goto')} {isCoursePage ? $t('navigation.courses') : $t('navigation.classroomio_home')}"
        id="logo"
        class="line-clamp-1 text-lg"
      >
        {isCoursePage ? title : 'ClassroomIO'}
      </a>
    </div>

    <span class="grow"></span>

    <li>
      <BellIcon class="custom text-white" size={16} />
    </li>
    <li>
      <!-- <IconButton size="small" onClick={toggleDarkMode}>
        {#if $globalStore.isDark}
          <SunIcon size={16} class="custom" />
        {:else}
          <MoonIcon class="custom text-white" size={16} />
        {/if}
      </IconButton> -->
      <ModeSwitcher />
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
