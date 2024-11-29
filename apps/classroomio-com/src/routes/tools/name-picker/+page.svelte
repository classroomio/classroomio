<script lang="ts">
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';

  let namesInput = '';
  let numNames = 0;
  let wordCount = 0;
  let selectedNames: string[] = [];
  let avatarUrls: string[] = [];
  let avatarUrlsFetched = false;

  // function to shuffle an array
  const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // function to reset entries
  const resetEntry = () => {
    namesInput = '';
    numNames = 0;
    wordCount = 0;
    selectedNames = [];
  };

  // function to sort the input alphabetically
  const sortRandom = () => {
    const sortedNames = namesInput
      .split(',')
      .map((name) => name.trim())
      .sort((a, b) => a.localeCompare(b));
    namesInput = sortedNames.join(', ');
  };

  // function to unsort
  const unsortRandom = () => {
    const unsortedNames = namesInput
      .split(',')
      .map((name) => name.trim())
      .sort(() => 0.5 - Math.random());
    namesInput = unsortedNames.join(', ');
  };

  const selectName = async () => {
    const namesArray = namesInput.split(',').map((name) => name.trim());

    if (numNames > namesArray.length) {
      console.error('Number of names to pick exceeds the length of the name list.');
      return;
    }

    wordCount = namesArray.length;
    const shuffledNames = shuffleArray(namesArray);

    selectedNames = shuffledNames.slice(0, numNames);
    avatarUrls = []; // reset avatar URLs
    avatarUrlsFetched = false; // reset avatarUrlsFetched flag

    try {
      // set loading state
      avatarUrlsFetched = false;

      // generate avatar for each selected name
      for (const name of selectedNames) {
        const avatarUrl = await generateRandomAvatar('pixel-art');
        if (avatarUrl) {
          avatarUrls.push(avatarUrl);
        }
      }

      // set avatarUrlsFetched to true after avatars are fetched
      avatarUrlsFetched = true;
    } catch (error) {
      console.error('Error fetching avatars:', error);
      avatarUrlsFetched = true;
    }
  };

  // function to generate a random avatar
  async function generateRandomAvatar(styleName: string, format = 'svg') {
    const baseUrl = 'https://api.dicebear.com/8.x/';
    const randomSeed = Math.random().toString(36).substring(7);

    try {
      const apiUrl = `${baseUrl}${styleName}/svg?seed=${randomSeed}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch avatar');
      }

      return response.url;
    } catch (error) {
      console.error('Error generating random avatar:', error);
      return null;
    }
  }

  $: wordCount = namesInput?.split(',').filter((name) => name.trim())?.length ?? 0;
</script>

<svelte:head>
  <title>Random Name Picker | ClassroomIO</title>
  <meta
    property="og:image"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />
  <meta property="og:title" content="Random Name Picker | ClassroomIO" />
  <meta
    property="og:description"
    content="Use this online name picker to draw a random name from a list of names for your online or physical classroom."
  />

  <meta
    property="og:image:secure_url"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />

  <meta name="twitter:title" content="Random Name Picker | ClassroomIO" />
  <meta
    name="twitter:description"
    content="Use this online name picker to draw a random name from a list of names for your online or physical classroom."
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<section class="mt-[10%] md:mt-16 px-5 md:px-0 bg-white dark:bg-gray-900">
  <ToolsHeader>
    <img
      src="/free-tools/name-picker.svg"
      class="w-[15%] md:w-[5%] mx-auto border rounded-full dark:border-gray-700"
      alt=""
    />
    <h1 class="text-4xl md:text-6xl font-bold text-[#040F2D] dark:text-white my-3">Random Name Picker</h1>
    <p class="text-md text-[#656565] dark:text-gray-400 font-light md:font-normal md:w-[45%] mx-auto">
      Use this online name picker to draw a random name from a list of names, or to draw several
      names randomly out of a list. You can use it as a name randomizer for a class activities.
    </p>
  </ToolsHeader>

  <div class="border dark:border-gray-700 rounded-md md:w-[60%] my-10 py-8 md:py-[3%] mx-auto shadow-md bg-white dark:bg-gray-800">
    <div class="w-[85%] md:w-[70%] mx-auto bg-white dark:bg-gray-800">
      <h1 class="font-bold text-sm dark:text-white">List of names</h1>

      <!-- container -->
      <div
        class="relative focus-within:border-[#0233BD] dark:focus-within:border-blue-500 border-2 dark:border-gray-600 mt-5 h-[12rem] pl-3 pt-2 overflow-hidden rounded-sm bg-[#F1F2F4] dark:bg-gray-700"
      >
        <!-- sidebar -->
        <div class="flex flex-col gap-y-3 absolute right-2 md:right-7 top-3">
          <button
            type="button"
            on:click={sortRandom}
            class="p-1.5 rounded-full bg-[#D9E0F5] dark:bg-gray-600 flex justify-center items-center"
          >
            <img src="/sort-icon.svg" class="w-2.5 dark:invert" alt="" />
          </button>
          <button
            type="button"
            on:click={unsortRandom}
            class="p-1.5 rounded-full bg-[#D9E0F5] dark:bg-gray-600 flex justify-center items-center"
          >
            <img src="/unsort-icon.svg" class="w-2.5 dark:invert" alt="" />
          </button>
        </div>

        <!-- content -->
        <div class="z-10 h-[80%]">
          <span
            role="textbox"
            tabindex={0}
            contenteditable
            bind:textContent={namesInput}
            class="w-full pr-9 md:pr-14 overflow-y-auto text-xs block border-0 outline-none h-full dark:text-white"
          ></span>
        </div>

        <!-- word count -->
        <p
          class="rounded-xl w-[80px] mt-1 py-1 bg-[#D9E0F5] dark:bg-gray-600 text-center text-[#0F62FE] dark:text-blue-300 text-[10px] font-semibold"
        >
          name count: {wordCount}
        </p>
      </div>
      <p class="py-4 border-b dark:border-gray-700 text-xs dark:text-gray-400">Each name must be separated by a comma</p>

      <div class="mt-10">
        <h1 class="font-bold text-sm dark:text-white">Number of Names</h1>
        <!-- number input & button -->
        <div class="flex flex-wrap gap-y-3 justify-between w-full mt-5">
          <input
            type="number"
            bind:value={numNames}
            class="px-3 py-2 text-sm w-full md:w-2/4 border-2 dark:border-gray-600 rounded-sm outline focus:border-[#0233BD] dark:focus:border-blue-500 bg-[#F1F2F4] dark:bg-gray-700 outline-none dark:text-white"
          />
          <button
            type="button"
            on:click={selectName}
            class="bg-[#0F62FE] dark:bg-blue-600 rounded-md text-sm py-3 md:py-0 text-white w-[70%] md:w-[35%]"
            >Select name(s) at random</button
          >
        </div>
      </div>

      <!-- footer logo -->
      <div class="py-3 mt-10 mb-5 bg-[#F1F6FF] dark:bg-gray-700 flex justify-center items-center gap-3">
        <img src="/free-tools/name-picker.svg" class="w-[12%] md:w-[9%] dark:invert" alt="" />
        {#if selectedNames.length > 0}
          <h1 class="text-[#0233BD] dark:text-blue-300 text-xl font-bold">Selected Names</h1>
        {/if}
      </div>

      <!-- loading state -->
      {#if selectedNames.length > 0 && !avatarUrlsFetched}
        <div class="w-full flex justify-center items-center">
          <p class="font-bold dark:text-white">Loading...</p>
        </div>
      {/if}

      <!-- generated name -->
      {#if selectedNames.length > 0 && avatarUrlsFetched}
        <div>
          <ul>
            {#each selectedNames as name, index}
              <li class="py-2 border-b dark:border-gray-700">
                <div class="flex item-center gap-3 md:gap-5 justify-center">
                  <img src={avatarUrls[index]} alt="" class="w-7" />
                  <p class="font-medium text-sm md:text-base flex justify-center items-center dark:text-white">
                    {name}
                  </p>
                </div>
              </li>
            {/each}
          </ul>

          <div class="flex flex-wrap justify-between md:justify-center items-center md:gap-3 mt-3">
            <button
              type="button"
              on:click={resetEntry}
              class="py-2 border dark:border-gray-600 text-xs md:text-sm rounded-md w-[45%] md:w-[20%] dark:text-white"
              >Reset Entries</button
            >
            <button
              type="button"
              on:click={selectName}
              class="py-2 bg-[#0F62FE] dark:bg-blue-600 rounded-md text-xs md:text-sm text-white w-[45%] md:w-[27%]"
              >Select other names</button
            >
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  :global(.dark) {
    color-scheme: dark;
  }
</style>

