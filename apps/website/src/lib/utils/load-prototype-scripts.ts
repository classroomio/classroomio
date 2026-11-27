export function loadPrototypeScripts(scripts: string[]): () => void {
  document.documentElement.classList.add('js');

  const loaded: HTMLScriptElement[] = [];

  for (const src of scripts) {
    const script = document.createElement('script');
    script.src = src;
    document.body.appendChild(script);
    loaded.push(script);
  }

  return () => {
    for (const script of loaded) {
      script.remove();
    }
  };
}
