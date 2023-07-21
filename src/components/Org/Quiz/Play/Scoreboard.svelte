<script>
  import PlayContainer from './Container.svelte';
  import PlayHeader from './Header/index.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../../PrimaryButton/constants';

  function goToNextQuestion() {}

  const players = [
    {
      avatar: 'snowball',
      name: 'Player 1',
      score: 112,
    },
    {
      avatar: 'simon',
      name: 'Player 3',
      score: 44,
    },
    {
      avatar: 'cleo',
      name: 'Player 2',
      score: 80,
    },
    {
      avatar: 'annie',
      name: 'Player 5',
      score: 1,
    },
  ];
</script>

<PlayContainer>
  <div slot="header">
    <PlayHeader />
  </div>

  <div slot="body" class="px-5 overflow-y flex flex-col items-center">
    <h1 class="text-white mb-5 font-bold text-3xl">Scoreboard</h1>

    <div class="players rounded-md bg-white dark:bg-gray-700 p-7 px-12">
      {#each players as player}
        <div class="flex items-center gap-28 mb-4">
          <div class="flex items-center">
            <img
              src="/images/avatars/{player.avatar}.svg"
              alt="avatar"
              class="w-12 h-12 rounded-full mr-2"
            />
            <p class="text-md">{player.name}</p>
          </div>
          <p class="text-2xl font-bold text-blue-700">{player.score}</p>
        </div>
      {/each}
    </div>
  </div>

  <div slot="footer" class="flex justify-center items-center w-full px-10 py-6">
    <p class="font-bold mr-3">Continue?</p>
    <PrimaryButton
      label="Next Question"
      variant={VARIANTS.OUTLINED}
      onClick={goToNextQuestion}
      className="rounded-md"
    />
  </div>
</PlayContainer>

<style>
  .players {
    max-width: 400px;
  }
</style>
