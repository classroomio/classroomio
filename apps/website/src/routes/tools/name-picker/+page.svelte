<script lang="ts">
  import { ToolsHeader } from '$lib/components';

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
  <meta property="og:image" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
  <meta property="og:title" content="Random Name Picker | ClassroomIO" />
  <meta
    property="og:description"
    content="Use this online name picker to draw a random name from a list of names for your online or physical classroom."
  />

  <meta property="og:image:secure_url" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />

  <meta name="twitter:title" content="Random Name Picker | ClassroomIO" />
  <meta
    name="twitter:description"
    content="Use this online name picker to draw a random name from a list of names for your online or physical classroom."
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<section class="bg-white px-5 md:px-0">
  <ToolsHeader>
    <img src="/free-tools/name-picker.svg" class="mx-auto w-[15%] rounded-full border md:w-[5%]" alt="" />
    <h1 class="my-3 text-4xl font-bold text-[#040F2D] md:text-6xl">Random Name Picker</h1>
    <p class="text-md mx-auto font-light text-[#656565] md:w-[45%] md:font-normal">
      Use this online name picker to draw a random name from a list of names, or to draw several names randomly out of a
      list. You can use it as a name randomizer for a class activities.
    </p>
  </ToolsHeader>

  <div class="mx-auto my-10 rounded-md border bg-white py-8 shadow-md md:w-[60%] md:py-[3%]">
    <div class="mx-auto w-[85%] bg-white md:w-[70%]">
      <h1 class="text-sm font-bold">List of names</h1>

      <!-- container -->
      <div
        class="relative mt-5 h-[12rem] overflow-hidden rounded-sm border-2 bg-[#F1F2F4] pl-3 pt-2 focus-within:border-[#0233BD]"
      >
        <!-- sidebar -->
        <div class="absolute right-2 top-3 flex flex-col gap-y-3 md:right-7">
          <button
            type="button"
            on:click={sortRandom}
            class="flex items-center justify-center rounded-full bg-[#D9E0F5] p-1.5"
          >
            <img src="/sort-icon.svg" class="w-2.5" alt="" />
          </button>
          <button
            type="button"
            on:click={unsortRandom}
            class="flex items-center justify-center rounded-full bg-[#D9E0F5] p-1.5"
          >
            <img src="/unsort-icon.svg" class="w-2.5" alt="" />
          </button>
        </div>

        <!-- content -->
        <div class="z-10 h-[80%]">
          <span
            role="textbox"
            tabindex={0}
            contenteditable
            bind:textContent={namesInput}
            class="block h-full w-full overflow-y-auto border-0 pr-9 text-xs outline-none md:pr-14"
          ></span>
        </div>

        <!-- word count -->
        <p class="mt-1 w-[80px] rounded-xl bg-[#D9E0F5] py-1 text-center text-[10px] font-semibold text-[#0F62FE]">
          name count: {wordCount}
        </p>
      </div>
      <p class="border-b py-4 text-xs">Each name must be separated by a comma</p>

      <div class="mt-10">
        <h1 class="text-sm font-bold">Number of Names</h1>
        <!-- number input & button -->
        <div class="mt-5 flex w-full flex-wrap justify-between gap-y-3">
          <input
            type="number"
            bind:value={numNames}
            class="w-full rounded-sm border-2 bg-[#F1F2F4] px-3 py-2 text-sm outline-none outline focus:border-[#0233BD] md:w-2/4"
          />
          <button
            type="button"
            on:click={selectName}
            class="w-[70%] rounded-md bg-[#0F62FE] py-3 text-sm text-white md:w-[35%] md:py-0"
            >Select name(s) at random</button
          >
        </div>
      </div>

      <!-- footer logo -->
      <div class="mb-5 mt-10 flex items-center justify-center gap-3 bg-[#F1F6FF] py-3">
        <img src="/free-tools/name-picker.svg" class="w-[12%] md:w-[9%]" alt="" />
        {#if selectedNames.length > 0}
          <h1 class="text-xl font-bold text-[#0233BD]">Selected Names</h1>
        {/if}
      </div>

      <!-- loading state -->
      {#if selectedNames.length > 0 && !avatarUrlsFetched}
        <div class="flex w-full items-center justify-center">
          <p class="font-bold">Loading...</p>
        </div>
      {/if}

      <!-- generated name -->
      {#if selectedNames.length > 0 && avatarUrlsFetched}
        <div>
          <ul>
            {#each selectedNames as name, index}
              <li class="border-b py-2">
                <div class="item-center flex justify-center gap-3 md:gap-5">
                  <img src={avatarUrls[index]} alt="" class="w-7" />
                  <p class="flex items-center justify-center text-sm font-medium md:text-base">
                    {name}
                  </p>
                </div>
              </li>
            {/each}
          </ul>

          <div class="mt-3 flex flex-wrap items-center justify-between md:justify-center md:gap-3">
            <button
              type="button"
              on:click={resetEntry}
              class="w-[45%] rounded-md border py-2 text-xs md:w-[20%] md:text-sm">Reset Entries</button
            >
            <button
              type="button"
              on:click={selectName}
              class="w-[45%] rounded-md bg-[#0F62FE] py-2 text-xs text-white md:w-[27%] md:text-sm"
              >Select other names</button
            >
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
