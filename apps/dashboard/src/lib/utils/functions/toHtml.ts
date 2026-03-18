import { browser } from '$app/environment';

export const isHtmlValueEmpty = (html: string) => {
  if (!html || typeof html !== 'string') return true;

  if (/<svg\b/i.test(html)) return false;

  if (!document || !browser) return false;

  return getTextFromHTML(html) === '';
};

export const getTextFromHTML = (html: string): string => {
  const dummyDiv = document.createElement('div');
  dummyDiv.innerHTML = html;

  return dummyDiv.textContent?.trim() || '';
};
