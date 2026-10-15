import { mount } from 'svelte';
import { renderCertificateDocument, resolveCertificateDesign } from '@cio/certificates';
import SafeHtmlContent from '@cio/ui/custom/safe-html-content/safe-html-content.svelte';

/** The real certificate renderer (packages/certificates) as a printable document. */
export function certificateHtml(stored: unknown, data: Record<string, string>): string {
  return renderCertificateDocument(resolveCertificateDesign(stored as never), data as never);
}

/** Lesson notes: the product's sanitising renderer (SafeHtmlContent). */
export function renderHtmlInto(target: HTMLElement, content: string) {
  return mount(SafeHtmlContent, { target, props: { content } });
}
