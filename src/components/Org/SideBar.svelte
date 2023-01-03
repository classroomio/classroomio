<script>
  import { stores } from '@sapper/app';
  import UserAvatar from 'carbon-icons-svelte/lib/UserAvatar20';
  import Help from 'carbon-icons-svelte/lib/Help20';

  import TextChip from '../../components/Chip/Text.svelte';
  import OrgSelector from '../../components/OrgSelector/OrgSelector.svelte';
  import HomeIcon from '../../components/Icons/HomeIcon.svelte';
  import CourseIcon from '../../components/Icons/CourseIcon.svelte';
  import SiteSettingsIcon from '../../components/Icons/SiteSettingsIcon.svelte';
  import AudienceIcon from '../../components/Icons/AudienceIcon.svelte';
  import { currentOrg } from '../../utils/store/org';

  let orgName = '';
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

  $: orgName = $currentOrg.siteName;
</script>

<aside class="root bg-gray-100 h-full">
  <div class="h-full flex flex-col">
    <div class="border-b border-gray-200 pt-5 px-4 ">
      <TextChip value="DA" />

      <OrgSelector />

      <ul class="my-5">
        <a href="/org/{orgName}" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgName}`
            ) && activeClass}"
          >
            <HomeIcon />
            <p class="ml-2">Home</p>
          </li>
        </a>
        <a href="/org/{orgName}/courses" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgName}/courses`
            ) && activeClass}"
          >
            <CourseIcon />
            <p class="ml-2">Courses</p>
          </li>
        </a>
        <a href="/org/{orgName}/site" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgName}/site`
            ) && activeClass}"
          >
            <SiteSettingsIcon />
            <p class="ml-2">Site settings</p>
          </li>
        </a>
        <a href="/org/{orgName}/audience" class="text-black">
          <li
            class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
              $page.path,
              `/org/${orgName}/audience`
            ) && activeClass}"
          >
            <AudienceIcon />
            <p class="ml-2">Audience</p>
          </li>
        </a>
      </ul>
    </div>
    <span class="flex-grow" />
    <ul class="my-5 pb-5 px-4 ">
      <a href="/help" class="text-black">
        <li class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200">
          <Help />
          <p class="ml-2">Help</p>
        </li>
      </a>
      <a href="/org/{orgName}/settings" class="text-black">
        <li
          class="flex items-center py-3 px-4 mb-2 rounded hover:bg-gray-200 {isActive(
            $page.path,
            `/org/${orgName}/settings`
          ) && activeClass}"
        >
          <UserAvatar />
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
