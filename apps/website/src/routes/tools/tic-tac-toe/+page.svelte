<script lang="ts">
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import Board from '$lib/features/tools/tic-tac-toe/board.svelte';
  import { TicTacToe } from '$lib/features/tools/tic-tac-toe/board';
  import { scores, changeToComputer } from '$lib/features/tools/tic-tac-toe/store';
  import { ToolsHeader } from '$lib/components';

  let startGame = false;
  let message: string | null = null;
  let winner: Winner | null = null;
  let game = createGame();

  interface Winner {
    symbol?: string;
  }

  function createGame() {
    message = '';
    winner = null;

    return TicTacToe({
      onWin(winnerInfo) {
        console.log('winner object', winnerInfo);
        winner = winnerInfo;

        scores.update((currentScores) => {
          if (winner!.symbol === 'X') {
            return { ...currentScores, X: currentScores.X + 1 };
          } else if (winner!.symbol === 'O') {
            return { ...currentScores, O: currentScores.O + 1 };
          }
          return currentScores;
        });

        if (winner!.symbol === 'O') {
          message = `Winner: Player 2 wins the round`;
        } else if (winner!.symbol === 'X') {
          message = `Winner: Player 1 wins the round`;
        }
      },

      onTie() {
        message = `Tie game!`;
      }
    });
  }

  function newGame() {
    // reset scores to zero
    scores.update(() => ({
      X: 0,
      O: 0,
      draw: 0
    }));

    // disable ai
    $changeToComputer = { change: false };

    // create a new game instance
    game = createGame();
  }

  function playAgain() {
    message = '';
    // create a new game instance
    game = createGame();
  }

  function changePlayer() {
    changeToComputer.update((value) => ({ change: !value.change }));
  }

  function startTicTac() {
    startGame = true;
  }
</script>

<svelte:head>
  <title>Tic Tac Toe | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
  <meta property="og:title" content="Tic Tac Toe | ClassroomIO" />
  <meta
    property="og:description"
    content="A simple and free tic tac toe game to play to your friends in class or outside the classroom."
  />

  <meta property="og:image:secure_url" itemprop="image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />

  <meta name="twitter:title" content="Tic Tac Toe | ClassroomIO" />
  <meta
    name="twitter:description"
    content="A simple and free tic tac toe game to play to your friends in class or outside the classroom."
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<section class=" bg-white px-5 md:px-0">
  <ToolsHeader className="mb-10">
    <img src="/free-tools/tic-tac.svg" class="mx-auto w-14 rounded-full border md:w-[5%]" alt="Tic Tac Icon" />
    <h1 class="my-3 text-4xl font-bold text-[#040F2D] md:text-6xl">Tic-Tac game</h1>
    <p class="text-md mx-auto font-light text-[#656565] md:w-[45%] md:font-normal">
      More than just a game; it's an educational tool that teaches pattern recognition, and decision-making.
    </p>
  </ToolsHeader>

  <div
    class="tic-tac-bg relative mx-auto flex h-[55vh] w-full items-center justify-center overflow-hidden border-8 border-black bg-white text-white md:h-[82vh] md:w-[59%]"
  >
    <!-- congratulatory message -->
    {#if message}
      <div
        transition:fly={{ x: -100, delay: 600, easing: sineInOut }}
        class="absolute top-[43%] z-[150] flex w-full flex-col items-center justify-center"
      >
        <div
          class="flex h-[8vh] w-full items-center justify-center gap-10 bg-white py-1 font-bold text-[#0233BD] md:h-[13vh]"
        >
          {#if message != 'Tie game!'}
            <img src="/free-tools/tic-tac/winner-star-icon.svg" alt="Star icon" class="h-full" />
          {/if}
          <h2 class="text-xs md:text-base">{message}</h2>
        </div>

        <button
          type="button"
          on:click={playAgain}
          class="mt-10 rounded-md border border-white bg-[#0F62FE] px-16 pb-1.5 pt-1 text-xs font-bold md:text-base"
          >Play Again</button
        >
      </div>
    {/if}

    <!-- this condition renders the game -->
    {#if startGame}
      <div class="flex h-full w-full flex-col items-center justify-between border p-5">
        <header class="flex w-full items-center justify-between">
          <button
            on:click={changePlayer}
            class="flex w-[35%] flex-row items-center gap-2 text-[10px] font-medium leading-3 md:w-28 md:text-xs"
          >
            <img src="/free-tools/tic-tac/computer-icon.svg" alt="Computer icon" class="w-4 md:w-6" />
            {#if $changeToComputer.change}
              Play two players
            {:else}
              Change to computer
            {/if}
          </button>
          <button
            on:click={newGame}
            class="flex w-24 flex-col items-center gap-1 rounded-md border bg-white p-2 text-[10px] font-medium leading-3 text-[#0542CC] shadow-md"
          >
            <img src="/free-tools/tic-tac/restart-icon.svg" alt="Restart icon" class="w-3 md:w-4" />
            Reset Score</button
          >
        </header>

        <!-- board -->
        <Board {game} {winner} />

        <!-- scores -->
        <div class="flex w-full items-center justify-between gap-10 font-semibold text-white md:justify-center">
          <div class="flex items-center gap-2 text-2xl md:gap-5 md:text-3xl">
            <span class="bg-[#FE28CB99] px-1 text-[10px] md:p-1 md:text-sm">Player 1</span>
            {$scores.X}
          </div>
          <div class="flex items-center gap-2 text-2xl md:gap-5 md:text-3xl">
            <span class="bg-[#0F62FE] px-1 text-[10px] md:p-1 md:text-sm">Draw</span>
            {$scores.draw}
          </div>
          <div class="flex items-center gap-2 text-2xl md:gap-5 md:text-3xl">
            <span class="bg-[#94F7FFB2] px-1 text-[10px] md:p-1 md:text-sm">Player 2</span>
            {$scores.O}
          </div>
        </div>
      </div>

      <!-- this condition renders the homepage -->
    {:else}
      <div class="flex flex-col items-center gap-5">
        <img src="/free-tools/tic-tac/tic-tac-start-icon.svg" alt="Tic tac toe game icon" class="w-[50%] md:w-[70%]" />
        <div class="flex flex-col gap-3">
          <button
            type="button"
            on:click={() => {
              changePlayer();
              startTicTac();
            }}
            class="mt-5 rounded-md border border-white bg-[#0F62FE] px-[3.3rem] pb-1.5 pt-1 text-sm font-bold"
          >
            Play with computer</button
          >
          <button
            type="button"
            on:click={() => {
              startTicTac();
            }}
            class="rounded-md border border-white bg-[#0F62FE] px-16 pb-1.5 pt-1 text-sm font-bold"
            >Play two players</button
          >
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .tic-tac-bg {
    background: url('/free-tools/tic-tac/tic-tac-bg.svg');
    background-repeat: no-repeat;
    background-size: cover;
  }
</style>
