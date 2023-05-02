<script>
  import { stores } from '@sapper/app';
  import Help from 'carbon-icons-svelte/lib/Help20';

  import TextChip from '../../components/Chip/Text.svelte';
  import OrgSelector from '../../components/OrgSelector/OrgSelector.svelte';
  import HomeIcon from '../../components/Icons/HomeIcon.svelte';
  import CourseIcon from '../../components/Icons/CourseIcon.svelte';
  import SiteSettingsIcon from '../../components/Icons/SiteSettingsIcon.svelte';
  import AudienceIcon from '../../components/Icons/AudienceIcon.svelte';
  import Avatar from '../../components/Avatar/index.svelte';
  import { currentOrg } from '../../utils/store/org';
  import { profile } from '../../utils/store/user';

  let orgSiteName = '';
  let activeClass = 'bg-gray-200';
  let { page } = stores();

  function isActive(pagePath, itemPath) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }

  $: orgSiteName = $currentOrg.siteName;
</script>

<aside class="root bg-gray-100 h-full">
  <div class="h-full flex flex-col">
    <div class="border-b border-gray-200 pt-5 px-4">
      {#if $currentOrg.avatar_url}
        <Avatar
          src={$currentOrg.avatar_url}
          name={$currentOrg.name}
          shape="rounded-md"
          width="w-7"
          height="h-7"
        />
      {:else}
        <TextChip
          value={$currentOrg.shortName}
          className="bg-blue-200 font-bold"
        />
      {/if}

      <OrgSelector />

      <ul class="my-5">
        <a href="/org/{orgSiteName}" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgSiteName}`
            ) && activeClass}"
          >
            <HomeIcon />
            <p class="ml-2">Home</p>
          </li>
        </a>
        <a href="/org/{orgSiteName}/courses" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgSiteName}/courses`
            ) && activeClass}"
          >
            <CourseIcon />
            <p class="ml-2">Courses</p>
          </li>
        </a>
        <a href="/org/{orgSiteName}/site" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgSiteName}/site`
            ) && activeClass}"
          >
            <SiteSettingsIcon />
            <p class="ml-2">Site settings</p>
          </li>
        </a>
        <a href="/org/{orgSiteName}/audience" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgSiteName}/audience`
            ) && activeClass}"
          >
            <AudienceIcon />
            <p class="ml-2">Audience</p>
          </li>
        </a>
      </ul>
    </div>
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4">
      <a href="/help" class="text-black">
        <li class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200">
          <Help />
          <p class="ml-2">Help</p>
        </li>
      </a>
      <a href="/org/{orgSiteName}/settings" class="text-black">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
            $page.path,
            `/org/${orgSiteName}/settings`
          ) && activeClass}"
        >
          <Avatar
            src={$profile.avatar_url}
            name={$profile.username}
            width="w-7"
            height="h-7"
          />
          <p class="ml-2">Settings</p>
        </li>
      </a>
    </ul>
  </div>
</aside>

<style>
  .root {
    width: 250px;
  }
</style>
