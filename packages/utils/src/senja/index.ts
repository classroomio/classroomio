export function embedSenjaWidget(widgetId: string) {
  const s = document.createElement('script');

  s.setAttribute('src', `https://widget.senja.io/widget/${widgetId}/platform.js`);
  s.setAttribute('type', 'text/javascript');

  document.head.appendChild(s);
}
