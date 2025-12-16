<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import { Facebook, Linkedin } from '@lucide/svelte';

  import { htmlBody, type HtmlBody, openModal, isFormComplete } from './components/store';

  import Mood from './components/Mood.svelte';
  import Avatar from './components/Avatar.svelte';
  import Report from './components/Report.svelte';
  import FullView from './components/FullView.svelte';
  import Background from './components/Background.svelte';
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';
  import DownloadButton from './components/DownloadButton.svelte';

  const MAX_CHARS = 160;
  let remainingChars = MAX_CHARS;
  let showReport: boolean = false;
  let showSetter: boolean = true;
  let isDownloading: boolean = false;
  let isDisabled: boolean;

  // sets the result of the mini validation for the htmlBody store
  const unsubscribe = isFormComplete.subscribe((value) => {
    isDisabled = value;
  });

  function handleInputChange(event: any, property: keyof HtmlBody) {
    $htmlBody[property] = event.target.value;

    if (property === 'learning') {
      remainingChars = MAX_CHARS - event.target.value.length;
    }
  }

  function shareTemplate() {
    return encodeURIComponent(
      `Learning Progress Update: ${$htmlBody.learning} and I'm ${$htmlBody.mood.text}. \nGenerated yours on classroomio.com\n`
    );
  }

  function shareOnTwitter() {
    const text = shareTemplate();
    const hashtags = encodeURIComponent('classroomIO,progressReport');
    const url = `https://x.com/intent/post?text=${text}&hashtags=${hashtags}`;
    window.open(url);
  }

  function shareOnFacebook() {
    const text = shareTemplate();
    window.open(
      `https://www.facebook.com/dialog/share?app_id=145634995501895&display=popup&href=https%3A%2F%2Fclassroomio.com%2Fdocs%2F&redirect_uri=https%3A%2F%2Fclassroomio.com%2Ftools%2Fexplorer&hashtag=${text}`
    );
  }

  function shareOnLinkedIn() {
    const text = shareTemplate();
    const url = `http://www.linkedin.com/shareArticle?summary=${text}&text=${text}`;
    window.open(url);
  }

  onDestroy(() => {
    unsubscribe();
  });
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

<section class=" w-full px-1 md:w-full md:px-0">
  <ToolsHeader>
    <img src="/free-tools/progress-report.svg" class="mx-auto w-[15%] rounded-full border md:w-[5%]" alt="" />
    <h1 class="my-3 text-4xl font-bold text-[#040F2D] md:text-6xl">Progress Report</h1>
    <p class="text-md mx-auto font-light text-[#656565] md:w-[45%] md:font-normal">
      Generate cool reports of your learning progress. Share reports with your network for collaborative learning
    </p>
  </ToolsHeader>

  <!-- modals -->
  <Avatar />
  <Mood />
  <Background />
  <FullView />

  <div
    class="mx-auto my-10 flex w-full flex-col justify-evenly rounded-md border shadow-md md:w-11/12 md:flex-row lg:w-[80%]"
  >
    <!-- left side -->
    {#if showSetter}
      <div
        transition:fly={{ y: 100, easing: sineInOut }}
        class="mx-auto w-full p-5 md:w-[48%] md:max-w-[500px] md:border-r"
      >
        <!-- preview button -->
        <div class="mb-5 flex justify-end md:hidden">
          <button
            type="button"
            on:click={() => {
              showSetter = false;
              showReport = true;
            }}
            class="flex items-center justify-between gap-2 rounded-full bg-[#0233BD] px-3 py-1 text-xs text-white"
          >
            <img src="/free-tools/progress-report/preview-icon.svg" alt="preview icon" class="w-4" />
            Preview
          </button>
        </div>

        <!-- name input -->
        <div>
          <p class="text-sm text-[#656565]">Add your name</p>
          <input
            type="text"
            bind:value={$htmlBody.name}
            on:input={(event) => handleInputChange(event, 'name')}
            placeholder="Enter your name here"
            class="my-3 w-full rounded-sm border bg-[#F1F2F4] px-3 py-2 text-xs outline-none placeholder:text-sm placeholder:text-[#ADADAD]"
          />
        </div>

        <!-- mood input -->
        <div class="mt-3">
          <p class="text-sm text-[#656565]">Select your mood</p>
          <button
            type="button"
            on:click={() => ($openModal.mood = true)}
            class="my-3 flex w-full items-center justify-between rounded-sm border bg-[#F1F2F4] px-3 py-2 text-sm text-gray-400 outline-none"
          >
            {#if $htmlBody.mood.text}
              <div
                class="flex items-center justify-between rounded-2xl border border-[#EDEDED] bg-blue-500 px-3 py-1 text-[7px] font-semibold text-white md:text-xs"
              >
                {#if $htmlBody.mood.text}
                  <span class="flex items-center gap-1">
                    <p class="text-[9px] font-semibold md:text-xs">is {$htmlBody.mood.text}</p>
                    <img
                      src="https://assets.cdn.clsrio.com/progress-report/emojis/{$htmlBody.mood.iconSrc}.png"
                      alt={$htmlBody.mood.text}
                      class="w-3"
                    />
                  </span>
                {/if}
              </div>
            {:else}
              What feeling describes you?
              <img src="/free-tools/progress-report/smiley-face-icon.svg" alt="smiley face" class="w-3" />
            {/if}
          </button>
        </div>

        <!-- learning input -->
        <div class="mt-5">
          <p class="text-sm text-[#656565]">What are you learning?</p>
          <textarea
            bind:value={$htmlBody.learning}
            maxlength={MAX_CHARS}
            on:input={(event) => handleInputChange(event, 'learning')}
            placeholder="Tell us what you are learning"
            class="my-3 h-[17vh] w-full rounded-sm border bg-[#F1F2F4] px-3 py-2 text-sm outline-none placeholder:text-sm placeholder:text-[#ADADAD]"
          ></textarea>
          <p class="text-right text-xs text-[#656565]">{remainingChars} characters remaining</p>
        </div>

        <!-- range input -->
        <div class="mt-3">
          <p class="pb-4 text-sm text-[#656565]">Estimate your progress</p>
          <div class="flex items-center justify-between">
            <input
              type="range"
              min="0"
              max="100"
              bind:value={$htmlBody.progress}
              class="range-input"
              on:input={(event) => handleInputChange(event, 'progress')}
              style="background: linear-gradient(to right, #0F62FE {$htmlBody.progress}%, #ccc {$htmlBody.progress}%);"
            />
            <p class="text-sm font-semibold">{$htmlBody.progress}%</p>
          </div>
        </div>

        <!-- avatar button -->
        <div class="mt-3 flex flex-wrap items-center justify-between">
          <div class="w-full md:w-2/4">
            <p class="text-[12px] text-[#656565] md:text-sm">Choose your avatar</p>
            <button
              type="button"
              on:click={() => ($openModal.avatar = true)}
              class="mt-3 flex w-full items-center justify-between gap-2 bg-[#F7F7F7] px-5 py-1.5 md:w-[65%] md:justify-center md:px-0"
            >
              <img
                src={`https://assets.cdn.clsrio.com/progress-report/avatars/${$htmlBody.avatar || 'avatar_m'}.svg`}
                alt=""
                class="w-[15%] md:w-[30%]"
              />
              <img
                src="/free-tools/progress-report/question-mark.svg"
                alt="A question mark"
                class="w-[15%] md:w-[30%]"
              />
            </button>
          </div>

          <!-- & background -->
          <div class="w-full md:w-2/4">
            <p class="text-[12px] text-[#656565] md:text-sm">Choose your background</p>
            <button
              type="button"
              on:click={() => ($openModal.background = true)}
              class="mt-3 flex w-full items-center justify-between gap-2 bg-[#F7F7F7] px-5 py-1.5 md:w-[65%] md:justify-center md:px-0"
            >
              <img
                src={`https://assets.cdn.clsrio.com/progress-report/backgrounds/${
                  $htmlBody.background || 'blue_tetiary_background'
                }.webp`}
                alt="An avatar"
                class="w-[15%] md:w-[30%]"
              />
              <img
                src="/free-tools/progress-report/question-mark.svg"
                alt="A question mark"
                class="w-[15%] md:w-[30%]"
              />
            </button>
          </div>
        </div>
        <DownloadButton {isDisabled} {isDownloading} />
      </div>
    {/if}

    <!-- right side -->

    <div
      transition:fly={{ y: 100, easing: sineInOut }}
      class="mx-auto mt-5 w-full px-5 md:mt-0 md:w-[48%] md:min-w-[400px] md:max-w-[500px] md:p-5 md:px-1"
    >
      <div class="hidden md:block">
        <Report />

        <!-- download & share button -->
        <div class="mt-9 h-auto border-t px-2 pt-8">
          <DownloadButton {isDisabled} {isDownloading} text="Download Image" />

          <!-- share button -->
          <div class="mx-auto my-5 w-full md:w-[70%]">
            <h1 class="text-center text-sm font-semibold">Share on image on social media:</h1>

            <div class="mx-auto mt-2 flex w-[60%] justify-evenly gap-5 rounded-xl border px-5 py-2 md:w-[80%]">
              <button
                type="button"
                on:click={shareOnFacebook}
                class="w-10 transition-all duration-300 hover:scale-[1.2]"
              >
                <Facebook size={32} />
              </button>
              <button
                type="button"
                on:click={shareOnLinkedIn}
                class="w-10 transition-all duration-300 hover:scale-[1.2]"
              >
                <Linkedin size={32} />
              </button>
              <button type="button" on:click={shareOnTwitter} class="w-5 transition-all duration-300 hover:scale-[1.2]">
                <img src="/twitter_logo.png" alt="X.com" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {#if showReport}
        <!-- hide button -->
        <div class="mb-5 flex justify-end">
          <button
            type="button"
            on:click={() => {
              showReport = false;
              showSetter = true;
            }}
            class="flex items-center justify-between gap-2 rounded-full bg-[#0233BD] px-3 py-1 text-xs text-white"
          >
            <img src="/free-tools/progress-report/hide-icon.svg" alt="preview icon" class="w-4" />
            Close
          </button>
        </div>
        <Report />

        <!-- download & share button -->
        <div class="mt-9 h-auto border-t px-2 pt-8">
          <DownloadButton {isDisabled} {isDownloading} />

          <!-- share button -->
          <div class="mx-auto my-5 w-full md:w-[70%]">
            <h1 class="text-center text-sm font-semibold">Share on image on social media:</h1>

            <div class="mx-auto mt-2 flex w-[60%] justify-evenly gap-5 rounded-xl border px-5 py-2 md:w-[80%]">
              <button
                type="button"
                on:click={shareOnFacebook}
                class="w-10 transition-all duration-300 hover:scale-[1.2]"
              >
                <Facebook size={32} />
              </button>
              <button
                type="button"
                on:click={shareOnLinkedIn}
                class="w-10 transition-all duration-300 hover:scale-[1.2]"
              >
                <Linkedin size={32} />
              </button>
              <button type="button" on:click={shareOnTwitter} class="w-5 transition-all duration-300 hover:scale-[1.2]">
                <img src="/twitter_logo.png" alt="X.com" />
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .range-input {
    -webkit-appearance: none;
    appearance: none;
    width: 80%;
    cursor: pointer;
    outline: none;
    border-radius: 15px;
    height: 1rem;
  }

  .range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 1.5rem;
    width: 1.5rem;
    background-color: #0f62fe;
    border-radius: 50%;
    border: none;
    transition: 0.2s ease-in-out;
  }

  .range-input::-moz-range-thumb {
    height: 1rem;
    width: 1rem;
    background-color: yellow;
    border-radius: 50%;
    transition: 0.2s ease-in-out;
  }

  .range-input:active::-webkit-slider-thumb {
    border: 3px solid #fff;
    filter: drop-shadow(0px 1px 1px #000000);
  }

  .range-input:focus::-webkit-slider-thumb {
    border: 3px solid #fff;
    filter: drop-shadow(0px 1px 1px #000000);
  }

  .range-input::-moz-range-thumb:hover {
    border: 3px solid #fff;
    box-shadow: 0 0 0 10px rgba(255, 85, 0, 0.1);
  }

  .range-input:active::-moz-range-thumb {
    border: 3px solid #fff;
    filter: drop-shadow(0px 1px 1px #000000);
  }

  .range-input:focus::-moz-range-thumb {
    border: 3px solid #fff;
    filter: drop-shadow(0px 1px 1px #000000);
  }
</style>
