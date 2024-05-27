<script>
  import { VARIANTS } from '../../PrimaryButton/constants';
  import { globalStore } from '$lib/utils/store/app';
  import { ChevronDown, Settings } from 'carbon-icons-svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
</script>

<div class="px-4 py-4 rounded-md cursor-pointer">
  <div class="border-b py-3 space-y-4">
    <p class="text-xs font-semibold text-gray-500">PROFILE</p>
    <a href="#/" class="flex items-center gap-8">
      <span class="flex items-center gap-2">
        <img src="" alt="" class="h-8 w-8 rounded-full border border-red-500" />
        <div>
          <p class="text-sm font-semibold">Rotimi Best</p>
          <p class="text-xs">Best@classroomio.com</p>
        </div>
      </span>
      <Settings size={20} />
    </a>
  </div>
  {#if !$globalStore.isStudent}
    <div class="border-b py-3 space-y-4">
      <p class="text-xs font-semibold text-gray-500">CURRENT ORGANIZATION</p>
      <a href="#/" class="flex items-center gap-8">
        <span class="flex items-center gap-2">
          <img src="" alt="" class="h-8 w-8 rounded-md border border-red-500" />
          <div>
            <p class="text-sm font-semibold">Rotimi Best</p>
            <p class="text-xs">Best@classroomio.com</p>
          </div>
        </span>
        <Settings size={20} />
      </a>
    </div>
  {/if}

  <div class="border-b py-3 space-y-4">
    <p class="text-xs font-semibold text-gray-500">FREE TOOLS</p>
    <span class="flex items-center gap-2">
      <img src="" alt="" class="h-6 w-6 rounded-full border border-red-500" />
      <p class="text-sm font-semibold">Progress report</p>
    </span>
    <span class="flex items-center gap-2">
      <img src="" alt="" class="h-6 w-6 rounded-full border border-red-500" />
      <p class="text-sm font-semibold">Activity timer</p>
    </span>
    <span class="flex items-center gap-2">
      <img src="" alt="" class="h-6 w-6 rounded-full border border-red-500" />
      <p class="text-sm font-semibold">Tictac toe</p>
    </span>
    <div class="flex items-center justify-end">
      <PrimaryButton
        label="See more"
        variant={VARIANTS.TEXT}
        className="text-blue-900 font-semibold"
      />
      <ChevronDown class="text-blue-900" />
    </div>
  </div>
  {#if !$globalStore.isStudent}
    <div class="border-b py-3 space-y-4">
      <span class="flex items-center gap-2">
        <img src="" alt="" class="h-6 w-6 rounded-full border border-red-500" />
        <p class="text-sm font-semibold">Whats new?</p>
      </span>

      <span class="flex items-center gap-2">
        <img src="" alt="" class="h-6 w-6 rounded-full border border-red-500" />
        <p class="text-sm font-semibold">Launch week</p>
      </span>
    </div>
  {/if}

  <div class="border-b py-3 space-y-4">
    <span class="flex items-center gap-2">
      <img src="" alt="" class="h-6 w-6 rounded-full border border-red-500" />
      <p class="text-sm font-semibold">Logout</p>
    </span>
  </div>
</div>
