<script lang="ts">
  import { toPng } from 'html-to-image';
  import Mood from './components/Mood.svelte';
  import {
    openMoodModal,
    openAvatarModal,
    openBackgroundModal,
    htmlBody,
    nodeStore,
    type HtmlBody
  } from './components/store';
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';
  import Avatar from './components/Avatar.svelte';
  import Background from './components/Background.svelte';
  import Report from './components/Report.svelte';
  import FullView from './components/FullView.svelte';

  const MAX_CHARS = 164;
  let remainingChars = MAX_CHARS;

  function handleInputChange(event: any, property: keyof HtmlBody) {
    $htmlBody[property] = event.target.value;

    if (property === 'learning') {
      remainingChars = MAX_CHARS - event.target.value.length;
    }
  }

  function convertToPng() {
    if ($nodeStore) {
      toPng($nodeStore)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'my-image.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Oops, something went wrong!', error);
        });
    } else {
      console.error('Node is not defined');
    }
  }

  function shareOnTwitter() {
    const text = encodeURIComponent(
      `I'm sharing my progress here on Twitter, I'm learning ${$htmlBody.learning} and I'm ${$htmlBody.mood.text}`
    );
    const hashtags = encodeURIComponent('classroomIO,progressReport');
    const url = `https://x.com/intent/post?text=${text}&hashtags=${hashtags}`;
    window.open(url);
  }

  function shareOnInstagram() {
    window.open('  http://instagram.com/###?ref=badge');
  }

  function shareOnLinkedIn() {
    const text = encodeURIComponent(
      `I'm sharing my progress on LinkedIn, I'm learning ${$htmlBody.learning} and I'm ${$htmlBody.mood.text}`
    );
    const url = `http://www.linkedin.com/shareArticle?summary=${text}&text=${text}`;
    window.open(url);
  }
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
    content="Use this online name picker to draw a random name from a list of names for your online or physical classroom."
  />

  <meta
    property="og:image:secure_url"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />

  <meta name="twitter:title" content="Random Name Picker | ClassroomIO" />
  <meta
    name="twitter:description"
    content="Use this online name picker to draw a random name from a list of names for your online or physical classroom."
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<section class="mt-[30%] px-5 md:px-0 md:mt-[5%]">
  <ToolsHeader>
    <img
      src="/free-tools/progress-report.svg"
      class="w-[15%] md:w-[5%] mx-auto border rounded-full"
      alt=""
    />
    <h1 class="text-4xl md:text-6xl font-bold text-[#040F2D] my-3">Progress Report</h1>
    <p class="text-md text-[#656565] font-light md:font-normal md:w-[45%] mx-auto">
      Generate cool reports of your learning progress. Share reports with your network for
      collaborative learning
    </p>
  </ToolsHeader>

  <!-- modals -->
  <Avatar />
  <Mood />
  <Background />
  <FullView />

  <div
    class="border rounded-md w-full md:w-11/12 lg:w-[80%] my-10 mx-auto shadow-md flex md:flex-row flex-col justify-evenly"
  >
    <!-- left side -->
    <div class="w-full mx-auto md:w-[48%] max-w-[500px] p-5 md:border-r">
      <!-- name input -->
      <div>
        <p class="text-sm text-[#656565]">Add your name</p>
        <input
          type="text"
          bind:value={$htmlBody.name}
          on:input={(event) => handleInputChange(event, 'name')}
          placeholder="Enter your name here"
          class="w-full border my-3 py-2 px-3 outline-none rounded-sm bg-[#F1F2F4] text-xs placeholder:text-sm placeholder:text-[#ADADAD]"
        />
      </div>

      <!-- mood input -->
      <div class="mt-3">
        <p class="text-sm text-[#656565]">Select your mood</p>
        <button
          type="button"
          on:click={openMoodModal}
          class="w-full flex justify-between items-center border my-3 py-2 px-3 outline-none rounded-sm bg-[#F1F2F4] text-gray-400 text-sm"
          >What feeling describes you?
          <span>+</span>
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
          class="w-full h-[17vh] border my-3 py-2 px-3 outline-none rounded-sm bg-[#F1F2F4] text-sm placeholder:text-sm placeholder:text-[#ADADAD]"
        ></textarea>
        <p class="text-xs text-right text-[#656565]">{remainingChars} characters remaining</p>
      </div>

      <!-- range input -->
      <div class="mt-3">
        <p class="text-sm text-[#656565] pb-4">Estimate your progress</p>
        <div class="flex justify-between items-center">
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
      <div class="flex justify-between items-center mt-3">
        <div class="w-2/4">
          <p class="text-[12px] md:text-sm text-[#656565]">Choose your avatar</p>
          <button
            type="button"
            on:click={openAvatarModal}
            class="bg-[#F7F7F7] py-1.5 mt-3 flex w-[65%] items-center justify-center gap-2"
          >
            <img
              src="https://assets.cdn.clsrio.com/progress-report/avatars/avatar_l.svg"
              alt="An avatar"
              class="w-[30%]"
            />
            <img
              src="/free-tools/progress-report/question-mark.svg"
              alt="A question mark"
              class="w-[30%]"
            />
          </button>
        </div>

        <!-- & background -->
        <div class="w-2/4">
          <p class="text-[12px] md:text-sm text-[#656565]">Choose your background</p>
          <button
            type="button"
            on:click={openBackgroundModal}
            class="bg-[#F7F7F7] py-1.5 mt-3 flex w-[65%] items-center justify-center gap-2"
          >
            <img
              src="https://assets.cdn.clsrio.com/progress-report/backgrounds/blue_tetiary_background.png"
              alt="An avatar"
              class="w-[30%]"
            />
            <img
              src="/free-tools/progress-report/question-mark.svg"
              alt="A question mark"
              class="w-[30%]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- right side -->
    <div class="w-full mx-auto md:w-[48%] md:min-w-[300px] md:max-w-[500px] p-5">
      <Report />

      <!-- download & share button -->
      <div class="mt-9 pt-8 px-2 h-auto border-t">
        <button
          type="button"
          on:click={convertToPng}
          class="bg-[#0233BD] text-white text-xs font-semibold w-full py-3 rounded-md"
          >Download Image</button
        >

        <!-- share button -->
        <div class="w-full md:w-[70%] mx-auto mt-5">
          <h1 class="text-sm font-semibold text-center">Share on image on social media:</h1>

          <div
            class="flex justify-evenly border rounded-xl gap-5 w-[60%] md:w-[80%] px-5 py-2 mt-2 mx-auto"
          >
            <button
              type="button"
              on:click={shareOnInstagram}
              class="w-5 hover:scale-[1.2] transition-all duration-300"
            >
              <img src="/free-tools/progress-report/instagram.svg" alt="Instagram" />
            </button>
            <button
              type="button"
              on:click={shareOnLinkedIn}
              class="w-5 hover:scale-[1.2] transition-all duration-300"
            >
              <img src="/free-tools/progress-report/linkedin.svg" alt="Linkedin" />
            </button>
            <button
              type="button"
              on:click={shareOnTwitter}
              class="w-5 hover:scale-[1.2] transition-all duration-300"
            >
              <img src="/free-tools/progress-report/x.svg" alt="X.com" />
            </button>
          </div>
        </div>
      </div>
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
