export default class Player {
  constructor(_element: unknown) {}

  ready() {
    return Promise.resolve();
  }

  on(_event: string, _handler: (data: unknown) => void) {}

  destroy() {
    return Promise.resolve();
  }
}
