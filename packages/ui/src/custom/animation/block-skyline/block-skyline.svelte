<script module lang="ts">
  type Tone = 'muted' | 'tint' | 'soft' | 'primary';

  type DropOptions = {
    dropOrder: number;
    intervalMs: number;
    loop: boolean;
  };

  const COLUMNS: { grow: number; tones: Tone[] }[] = [
    { grow: 3, tones: ['muted', 'tint'] },
    { grow: 2, tones: ['tint', 'muted', 'soft'] },
    { grow: 4, tones: ['muted'] },
    { grow: 2, tones: ['primary', 'muted'] },
    { grow: 3, tones: ['muted', 'tint', 'muted'] },
    { grow: 2, tones: ['tint'] }
  ];

  const BASE_ROWS = Math.max(...COLUMNS.map((column) => column.tones.length));
  const EXTRA_TONES: Tone[] = ['muted', 'tint', 'muted', 'soft'];

  const TONE_CLASSES: Record<Tone, string> = {
    muted: 'ui:bg-muted',
    tint: 'ui:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]',
    soft: 'ui:bg-[color-mix(in_srgb,var(--primary)_35%,transparent)]',
    primary: 'ui:bg-primary'
  };

  const CYCLE_MS = 10000;
  const SEQUENCE_MS = 2100;
  const DROP_MS = 500;
  const BOUNCE_MS = 150;
  const SETTLE_MS = 300;
  const CLEAR_START = 0.8;
  const CLEAR_END = 0.88;

  const HIDDEN = { opacity: 0, transform: 'translateY(-28px)' };
  const LANDED = { opacity: 1, transform: 'translateY(0)' };
  const BOUNCED = { opacity: 1, transform: 'translateY(-3px)' };
  const CLEARED = { opacity: 0, transform: 'translateY(4px)' };
  const FALL_EASING = 'cubic-bezier(0.55, 0, 0.9, 0.45)';

  function rotate<T>(items: T[], by: number): T[] {
    const offset = by % items.length;

    return [...items.slice(offset), ...items.slice(0, offset)];
  }

  function stackTones(tones: Tone[], extraRows: number, columnIndex: number): Tone[] {
    const extraTones = Array.from(
      { length: extraRows },
      (_, extraIndex) => EXTRA_TONES[(columnIndex + extraIndex) % EXTRA_TONES.length]
    );

    return [...tones, ...extraTones];
  }

  function buildGroups(repeat: number, rows: number) {
    const extraRows = Math.max(rows - BASE_ROWS, 0);

    return Array.from({ length: repeat }, (_, groupIndex) =>
      rotate(COLUMNS, groupIndex * 2).map((column, columnIndex) => {
        const globalColumn = groupIndex * COLUMNS.length + columnIndex;
        const tones = stackTones(column.tones, extraRows, globalColumn);

        return {
          grow: column.grow,
          blocks: tones.map((tone, level) => ({
            tone,
            dropOrder: level * COLUMNS.length * repeat + globalColumn
          }))
        };
      })
    );
  }

  function playOnce(node: HTMLElement, startMs: number) {
    const total = DROP_MS + SETTLE_MS;

    return node.animate(
      [
        { ...HIDDEN, offset: 0, easing: FALL_EASING },
        { ...LANDED, offset: DROP_MS / total, easing: 'ease-out' },
        { ...BOUNCED, offset: (DROP_MS + BOUNCE_MS) / total, easing: 'ease-in' },
        { ...LANDED, offset: 1 }
      ],
      { duration: total, delay: startMs, fill: 'both' }
    );
  }

  function playLoop(node: HTMLElement, startMs: number) {
    const startAt = startMs / CYCLE_MS;
    const landAt = (startMs + DROP_MS) / CYCLE_MS;

    return node.animate(
      [
        { ...HIDDEN, offset: 0 },
        { ...HIDDEN, offset: startAt, easing: FALL_EASING },
        { ...LANDED, offset: landAt, easing: 'ease-out' },
        { ...BOUNCED, offset: landAt + BOUNCE_MS / CYCLE_MS, easing: 'ease-in' },
        { ...LANDED, offset: landAt + SETTLE_MS / CYCLE_MS },
        { ...LANDED, offset: CLEAR_START },
        { ...CLEARED, offset: CLEAR_END },
        { ...CLEARED, offset: 1 }
      ],
      { duration: CYCLE_MS, iterations: Infinity }
    );
  }

  function playDrop(node: HTMLElement, { dropOrder, intervalMs, loop }: DropOptions) {
    const startMs = dropOrder * intervalMs;

    return loop ? playLoop(node, startMs) : playOnce(node, startMs);
  }

  /**
   * Drops the block into place at its slot in the sequence. Looping blocks all clear together near the end of each cycle.
   */
  function dropIn(node: HTMLElement, options: DropOptions) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animation = playDrop(node, options);

    return {
      update(nextOptions: DropOptions) {
        animation.cancel();
        animation = playDrop(node, nextOptions);
      },
      destroy: () => animation.cancel()
    };
  }
</script>

<script lang="ts">
  import { cn } from '../../../tools';

  interface Props {
    loop?: boolean;
    repeat?: number;
    rows?: number;
    class?: string;
  }

  let { loop = true, repeat = 1, rows = BASE_ROWS, class: className }: Props = $props();

  const stackRows = $derived(Math.max(rows, BASE_ROWS));
  const groups = $derived(buildGroups(repeat, stackRows));
  const intervalMs = $derived((SEQUENCE_MS * BASE_ROWS) / (COLUMNS.length * repeat * stackRows));
</script>

<div
  aria-hidden="true"
  class={cn('ui:pointer-events-none ui:flex ui:items-end ui:gap-1.5', stackRows === BASE_ROWS && 'ui:h-16', className)}
>
  {#each groups as columns, groupIndex (groupIndex)}
    <div class={cn('ui:flex ui:flex-1 ui:items-end ui:gap-1.5', groupIndex > 0 && 'ui:hidden ui:md:flex')}>
      {#each columns as column, columnIndex (columnIndex)}
        <div class="ui:flex ui:flex-col-reverse ui:gap-1" style:flex-grow={column.grow} style:flex-basis="0">
          {#each column.blocks as block, level (level)}
            <span
              use:dropIn={{ dropOrder: block.dropOrder, intervalMs, loop }}
              class="ui:notch-cutout ui:h-3.5 ui:rounded-[5px] ui:[--notch-h:4px] ui:[--notch-w:20px] ui:[--notch-x:10px] {TONE_CLASSES[
                block.tone
              ]}"
            ></span>
          {/each}
        </div>
      {/each}
    </div>
  {/each}
</div>
