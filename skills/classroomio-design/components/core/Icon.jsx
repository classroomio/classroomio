import React from 'react';
const P = {
  sparkle: <path d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z"/>,
  users: <><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.8-3.6 3.2-5.6 6-5.6s5.2 2 6 5.6"/><circle cx="17.5" cy="9" r="2.4"/><path d="M16.5 14.6c2.3.2 4 1.9 4.5 4.9"/></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></>,
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6z"/>,
  chat: <><path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8.5 10.5h7"/></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6"/>,
  chevronDown: <path d="M6 9l6 6 6-6"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  close: <path d="M6 6l12 12M18 6L6 18"/>,
  github: <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>,
};
const FILLED = { play: <path d="M7 4l14 8-14 8z"/>, sparkleFill: <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/> };
export const ICON_NAMES = [...Object.keys(P), ...Object.keys(FILLED)];
export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  if (FILLED[name]) return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flexShrink: 0, ...style }}>{FILLED[name]}</svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, ...style }}>{P[name]}</svg>;
}