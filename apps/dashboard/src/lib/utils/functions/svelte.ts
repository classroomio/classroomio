export function once(fn) {
  return function (event) {
    // @ts-ignore
    if (fn) fn.call(this, event);
    fn = null;
  };
}

export function preventDefault(fn?: Function) {
  return function (event: Event) {
    event.preventDefault();

    if (!fn) return;

    // @ts-ignore
    fn.call(this, event);
  };
}

export function stopPropagation(fn?: Function) {
  return function (event: Event) {
    event.stopPropagation();

    if (!fn) return;

    // @ts-ignore
    fn.call(this, event);
  };
}
