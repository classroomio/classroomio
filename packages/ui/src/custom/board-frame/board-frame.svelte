<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    src: string;
    alt: string;
    url?: string;
    class?: string;
  }

  let { src, alt, url = 'app.classroomio.com', class: className = '' }: Props = $props();
</script>

<div class={cn('board-frame', className)}>
  <div class="board">
    <div class="chrome" aria-hidden="true">
      <span class="dot" style:left="calc(var(--u) * 21)"></span>
      <span class="dot" style:left="calc(var(--u) * 40)"></span>
      <span class="dot" style:left="calc(var(--u) * 59)"></span>
      <span class="url">{url}</span>
    </div>
    <img {src} {alt} class="screen" loading="eager" decoding="async" />
    <div class="shelf" aria-hidden="true">
      <span class="foot foot-left"></span>
      <span class="foot foot-right"></span>
    </div>
  </div>
</div>

<style>
  .board-frame {
    --u: calc(100cqw / 902);
    --ink: #17140f;
    --paper: #fdfbf7;
    --bone-300: #e3daca;
    --stroke: calc(var(--u) * 1.2);
    container-type: inline-size;
    width: 100%;
    padding: calc(var(--u) * 8) calc(var(--u) * 31) calc(var(--u) * 52);
  }

  .board {
    position: relative;
    border: var(--stroke) solid var(--ink);
    border-radius: calc(var(--u) * 14);
    background-color: var(--paper);
  }

  .chrome {
    position: relative;
    height: calc(var(--u) * 40);
    border-bottom: var(--stroke) solid var(--ink);
  }

  .dot {
    position: absolute;
    top: calc(var(--u) * 20);
    width: calc(var(--u) * 11);
    height: calc(var(--u) * 11);
    transform: translate(-50%, -50%);
    border: var(--stroke) solid var(--ink);
    border-radius: 9999px;
  }

  .url {
    position: absolute;
    top: calc(var(--u) * 9);
    left: calc(var(--u) * 86);
    width: calc(var(--u) * 381);
    height: calc(var(--u) * 22);
    padding-inline: calc(var(--u) * 12);
    overflow: hidden;
    border: var(--stroke) solid var(--bone-300);
    border-radius: calc(var(--u) * 5);
    background-color: var(--paper);
    color: var(--ink);
    font-family: Menlo, 'SF Mono', ui-monospace, monospace;
    font-size: calc(var(--u) * 11);
    line-height: calc(var(--u) * 20);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .screen {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 0 0 calc(var(--u) * 14) calc(var(--u) * 14);
  }

  .shelf {
    position: absolute;
    top: calc(100% + var(--u));
    right: calc(var(--u) * -30);
    left: calc(var(--u) * -30);
    height: calc(var(--u) * 17);
    border: var(--stroke) solid var(--ink);
    border-radius: calc(var(--u) * 2);
    background-color: var(--bone-300);
  }

  .foot {
    position: absolute;
    top: 100%;
    width: calc(var(--u) * 19);
    height: calc(var(--u) * 18);
    margin-top: calc(var(--stroke) * -1);
    border-bottom: var(--stroke) solid var(--ink);
  }

  .foot-left {
    left: calc(var(--u) * 63);
    border-left: var(--stroke) solid var(--ink);
  }

  .foot-right {
    right: calc(var(--u) * 63);
    border-right: var(--stroke) solid var(--ink);
  }
</style>
