// type T must be a HTMLElement (e.g. HTMLTextAreaElement extends HTMLElement)
export type HTMLElementEvent<T extends HTMLElement> = Event & {
  target: T;
  currentTarget: T;
};
