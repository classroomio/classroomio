<script lang="ts">
  import { sineInOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import WinningLine from './WinningLine.svelte';
  import { changeToComputer } from './store';

  interface Game {
    board: Array<Array<string>>;
    click: (rowIndex: number, columnIndex: number) => Game;
  }

  export let game: Game;
  export let winner = null;

  let customDelay: number;

  $: {
    if ($changeToComputer.change) {
      customDelay = 400;
    } else {
      customDelay = 0;
    }
  }
</script>

<div class="relative">
  <table>
    <tbody>
      {#each game.board as row, rowIndex}
        <tr>
          {#each row as column, columnIndex}
            <td
              class="cursor-pointer text-center h-25 w-[1.5em] border-r-10 border-b-10 border-white last:border-r-0"
              on:click={() => {
                game = game.click(rowIndex, columnIndex);
              }}
            >
              {#if column === 'X'}
                <img
                  transition:fly={{ y: 100, delay: 0, easing: sineInOut }}
                  src="/free-tools/tic-tac/tic-tac-x.svg"
                  alt="X icon"
                />
              {:else if column === 'O'}
                <img
                  transition:fly={{ y: 100, delay: customDelay, easing: sineInOut }}
                  src="/free-tools/tic-tac/tic-tac-o.svg"
                  alt="O icon"
                />
              {:else}
                <!-- empty cell -->
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <WinningLine {winner} />
</div>

<style>
  table {
    overflow: hidden;
    border-collapse: collapse;
    font-size: 4em;
    color: white;
    border: 0px;
    z-index: 10;
    position: relative;
  }

  td {
    overflow: hidden;
    text-align: center;
    height: 100px;
    width: 100px;
    border-right: 10px solid white;
    border-bottom: 10px solid white;
    position: relative;
    z-index: 10;
  }

  td:last-child {
    border-right: none;
  }

  tr:last-child td {
    border-bottom: none;
  }

  @media (max-width: 600px) {
    td {
      width: 16vw;
      height: 16vw;
    }
  }
</style>
