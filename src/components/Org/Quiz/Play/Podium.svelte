<script>
  import PlayContainer from './Container.svelte';
  import PlayHeader from './Header/index.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../../PrimaryButton/constants';
  import BarChart from '../../../BarChart/index.svelte';

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
      score: 65,
    },
  ];
  const data = players.map((p) => {
    return {
      avatar: `/images/avatars/${p.avatar}.svg`,
      name: p.name,
      count: p.score,
    };
  });
</script>

<PlayContainer>
  <div slot="header">
    <PlayHeader />
  </div>

  <div slot="body" class="px-5 overflow-y flex flex-col items-center">
    <h1 class="text-white mb-5 font-bold text-3xl">Podium</h1>

    <div class="chart rounded-md bg-white dark:bg-gray-700 p-7 px-12">
      <BarChart {data} barColor="blue" />
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
