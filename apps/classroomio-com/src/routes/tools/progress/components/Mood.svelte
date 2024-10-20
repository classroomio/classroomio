<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  import { htmlBody, openModal } from './store';

  interface Mood {
    text: string;
    iconSrc: string;
  }

  let moods: Mood[] = [
    {
      text: 'Unmotivated',
      iconSrc: 'unmotivated'
    },
    {
      text: 'Feeling Enlightened',
      iconSrc: 'feeling-enlightened'
    },
    {
      text: 'Enthusiastic',
      iconSrc: 'enthusiastic'
    },
    {
      text: 'Confused',
      iconSrc: 'confused'
    },
    {
      text: 'Feeling stuck',
      iconSrc: 'feeling-stuck'
    },
    // {
    //   text: 'Believing in the process',
    //   iconSrc: 'believing-in-the-process'
    // },
    {
      text: 'Curious',
      iconSrc: 'curious'
    },
    {
      text: 'Achieving Mastery',
      iconSrc: 'achieving-mastery'
    },
    {
      text: 'Feeling Positive',
      iconSrc: 'feeling-positive'
    },
    {
      text: 'Reflecting',
      iconSrc: 'reflecting'
    },
    {
      text: 'Making progress',
      iconSrc: 'progress'
    },
    {
      text: 'Feeling Sad',
      iconSrc: 'sad'
    }
  ];

  function selectMood(mood: Mood) {
    $htmlBody.mood.text = mood.text;
    $htmlBody.mood.iconSrc = mood.iconSrc;
    $openModal.mood = false;
  }
</script>

<Modal bind:open={$openModal.mood}>
  <!-- header -->
  <div class="flex justify-between">
    <h1 class="text-sm font-semibold">Choose your Mood</h1>
    <button
      type="button"
      onclick={() => ($openModal.mood = false)}
      class="p-2 bg-[#F1F6FF] hover:scale-110 transition-all duration-300 rounded-full w-6"
    >
      <img src="/free-tools/progress-report/close-icon.svg" alt="Close icon" />
    </button>
  </div>

  <!-- mapping -->
  <div class="flex flex-wrap justify-between gap-y-3 mt-3">
    {#each moods as mood}
      <button
        onclick={() => {
          selectMood(mood);
        }}
        class="flex gap-3 items-center shadow-sm rounded-full px-4 py-1 bg-[#F1F6FF] hover:bg-[#0233BD] hover:text-white transition-all duration-700"
      >
        <p class="text-xs md:text-sm font-semibold">{mood.text}</p>
        <img
          src="https://assets.cdn.clsrio.com/progress-report/emojis/{mood.iconSrc}.png"
          alt={mood.text}
          class="w-4"
        />
      </button>
    {/each}
  </div>
  <!--  -->
</Modal>
