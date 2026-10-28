export class InsightsPoller {
  readonly #intervalMs: number;
  readonly #onTick: () => void;
  #timer: ReturnType<typeof setInterval> | undefined;
  #missedTick = false;

  constructor(intervalMs: number, onTick: () => void) {
    this.#intervalMs = intervalMs;
    this.#onTick = onTick;
  }

  start() {
    this.stop();
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#timer = setInterval(this.#tick, this.#intervalMs);
  }

  stop() {
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
    if (this.#timer === undefined) return;

    clearInterval(this.#timer);
    this.#timer = undefined;
  }

  #tick = () => {
    if (document.visibilityState !== 'visible') {
      this.#missedTick = true;
      return;
    }

    this.#onTick();
  };

  #handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible' || !this.#missedTick) return;

    this.#missedTick = false;
    this.#onTick();
  };
}
