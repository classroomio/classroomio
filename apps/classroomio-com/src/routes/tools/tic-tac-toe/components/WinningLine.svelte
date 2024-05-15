<script lang="ts">
  export let winner: Winner | null = null;

  interface Winner {
    direction: 'horizontal' | 'vertical' | 'diagonal';
    row?: number;
    column?: number;
    diagonal?: 'top-left-to-bottom-right' | 'top-right-to-bottom-left';
  }

  $: if (winner) {
    if (winner.direction === 'vertical' && winner.column !== undefined) {
      document.documentElement.style.setProperty('--col-index', winner.column.toString());
    } else if (winner.direction === 'horizontal' && winner.row !== undefined) {
      document.documentElement.style.setProperty('--row-index', winner.row.toString());
    }
  }
</script>

{#if winner}
  <div
    class="winning-line absolute bg-[#ffc300] z-[100]"
    class:horizontal-line={winner.direction === 'horizontal'}
    class:vertical-line={winner.direction === 'vertical'}
    class:diagonal-line-1={winner.direction === 'diagonal' &&
      winner.diagonal === 'top-left-to-bottom-right'}
    class:diagonal-line-2={winner.direction === 'diagonal' &&
      winner.diagonal === 'top-right-to-bottom-left'}
  ></div>
{/if}

<style>
  .horizontal-line {
    top: calc(var(--row-index) * 100px + 50px - 5px);
    left: 0;
    width: 100%;
    height: 10px;
  }

  .vertical-line {
    top: 0;
    left: calc(var(--col-index) * 100px + 50px - 5px);
    width: 10px;
    height: 100%;
  }

  .diagonal-line-1 {
    top: 0;
    left: 0;
    width: 140%;
    height: 100%;
    background: none;
    border-top: 10px solid #ffc300;
    transform: rotate(45deg);
    transform-origin: top left;
  }

  .diagonal-line-2 {
    top: 0;
    right: 0;
    width: 140%;
    height: 100%;
    background: none;
    border-top: 10px solid #ffc300;
    transform: rotate(-45deg);
    transform-origin: top right;
  }

  @media (max-width: 600px) {
    .horizontal-line {
      top: calc(var(--row-index) * 16vw + 8vw - 5px);
    }

    .vertical-line {
      left: calc(var(--col-index) * 16vw + 8vw - 5px);
    }
  }
</style>
