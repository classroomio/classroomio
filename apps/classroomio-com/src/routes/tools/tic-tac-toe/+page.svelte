<script lang="ts">
  import { fly } from 'svelte/transition';
  import { sineInOut } from 'svelte/easing';
  import Board from './components/Board.svelte';
  import { TicTacToe } from './components/board';
  import { scores, changeToComputer } from './components/store';
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';

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
  <meta
    property="og:image"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />
  <meta property="og:title" content="Tic Tac Toe | ClassroomIO" />
  <meta
    property="og:description"
    content="A simple and free tic tac toe game to play to your friends in class or outside the classroom."
  />

  <meta
    property="og:image:secure_url"
    itemprop="image"
    content="https://brand.cdn.clsrio.com/og/free-tools.png"
  />

  <meta name="twitter:title" content="Tic Tac Toe | ClassroomIO" />
  <meta
    name="twitter:description"
    content="A simple and free tic tac toe game to play to your friends in class or outside the classroom."
  />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/free-tools.png" />
</svelte:head>

<section class="mt-[10%] md:mt-16 px-5 md:px-0 bg-white">
  <ToolsHeader className="mb-10">
    <img
      src="/free-tools/tic-tac.svg"
      class="w-14 md:w-[5%] mx-auto border rounded-full"
      alt="Tic Tac Icon"
    />
    <h1 class="text-4xl md:text-6xl font-bold text-[#040F2D] my-3">Tic-Tac game</h1>
    <p class="text-md text-[#656565] font-light md:font-normal md:w-[45%] mx-auto">
      More than just a game; it's an educational tool that teaches pattern recognition, and
      decision-making.
    </p>
  </ToolsHeader>

  <div
    class="overflow-hidden relative tic-tac-bg text-white w-full h-[55vh] md:w-[59%] md:h-[82vh] border-8 border-black mx-auto flex justify-center items-center bg-white"
  >
    <!-- congratulatory message -->
    {#if message}
      <div
        transition:fly={{ x: -100, delay: 600, easing: sineInOut }}
        class="absolute w-full top-[43%] flex flex-col justify-center items-center z-[150]"
      >
        <div
          class="flex gap-10 justify-center py-1 h-[8vh] md:h-[13vh] w-full items-center bg-white font-bold text-[#0233BD]"
        >
          {#if message != 'Tie game!'}
            <img src="/free-tools/tic-tac/winner-star-icon.svg" alt="Star icon" class="h-full" />
          {/if}
          <h2 class="md:text-base text-xs">{message}</h2>
        </div>

        <button
          type="button"
          on:click={playAgain}
          class="px-16 pt-1 pb-1.5 md:text-base text-xs border border-white font-bold rounded-md mt-10 bg-[#0F62FE]"
          >Play Again</button
        >
      </div>
    {/if}

    <!-- this condition renders the game -->
    {#if startGame}
      <div class="w-full h-full p-5 flex flex-col border justify-between items-center">
        <header class="flex w-full items-center justify-between">
          <button
            on:click={changePlayer}
            class="text-[10px] md:text-xs w-[35%] gap-2 md:w-28 flex flex-row items-center leading-3 font-medium"
          >
            <img
              src="/free-tools/tic-tac/computer-icon.svg"
              alt="Computer icon"
              class="w-4 md:w-6"
            />
            {#if $changeToComputer.change}
              Play two players
            {:else}
              Change to computer
            {/if}
          </button>
          <button
            on:click={newGame}
            class="text-[10px] w-24 flex flex-col gap-1 p-2 shadow-md rounded-md items-center leading-3 font-medium border text-[#0542CC] bg-white"
          >
            <img src="/free-tools/tic-tac/restart-icon.svg" alt="Restart icon" class="w-3 md:w-4" />
            Reset Score</button
          >
        </header>

        <!-- board -->
        <Board {game} {winner} />

        <!-- scores -->
        <div
          class="flex justify-between md:justify-center items-center gap-10 w-full text-white font-semibold"
        >
          <div class="md:text-3xl text-2xl flex items-center md:gap-5 gap-2">
            <span class="px-1 md:p-1 bg-[#FE28CB99] md:text-sm text-[10px]">Player 1</span>
            {$scores.X}
          </div>
          <div class="md:text-3xl text-2xl flex items-center md:gap-5 gap-2">
            <span class="px-1 md:p-1 bg-[#0F62FE] md:text-sm text-[10px]">Draw</span>
            {$scores.draw}
          </div>
          <div class="md:text-3xl text-2xl flex items-center md:gap-5 gap-2">
            <span class="px-1 md:p-1 bg-[#94F7FFB2] md:text-sm text-[10px]">Player 2</span>
            {$scores.O}
          </div>
        </div>
      </div>

      <!-- this condition renders the homepage -->
    {:else}
      <div class="flex flex-col items-center gap-5">
        <img
          src="/free-tools/tic-tac/tic-tac-start-icon.svg"
          alt="Tic tac toe game icon"
          class="w-[50%] md:w-[70%]"
        />
        <div class="flex flex-col gap-3">
          <button
            type="button"
            on:click={() => {
              changePlayer();
              startTicTac();
            }}
            class="mt-5 px-[3.3rem] pt-1 pb-1.5 border border-white text-sm font-bold rounded-md bg-[#0F62FE]"
          >
            Play with computer</button
          >
          <button
            type="button"
            on:click={() => {
              startTicTac();
            }}
            class="px-16 pt-1 pb-1.5 border border-white text-sm font-bold rounded-md bg-[#0F62FE]"
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
