export function tc<T>(tryFunc: () => T, catchFunc: T | ((e?: Error) => T)) {
  let val: T;
  try {
    val = tryFunc();
  } catch (e: unknown) {
    if (typeof catchFunc === 'function') {
      // @ts-ignore
      val = catchFunc(e);
    } else {
      val = catchFunc;
    }
  }
  return val;
}
