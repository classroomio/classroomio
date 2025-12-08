export function tc<T>(tryFunc: () => T, catchFunc: T | ((e?: Error) => T)) {
  let val: T;
  try {
    val = tryFunc();
  } catch (e: unknown) {
    if (typeof catchFunc === 'function') {
      // @ts-expect-error - catchFunc is a function
      val = catchFunc(e);
    } else {
      val = catchFunc;
    }
  }
  return val;
}
