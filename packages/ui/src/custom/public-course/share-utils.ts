export interface OutlineRailActionLabels {
  copyAsMarkdown: string;
  copied: string;
  share: string;
  facebook: string;
  linkedin: string;
  x: string;
  instagram: string;
  openInChat: string;
  openInChatGPT: string;
  openInClaude: string;
}

export function buildFacebookShareUrl(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

export function buildLinkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}

export function buildXShareUrl(pageUrl: string, pageTitle: string): string {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(pageTitle);

  return `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
}

export function openShareWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer,width=640,height=640');
}
