<script>
  import { onMount } from 'svelte';
  import { renderCertificateDocument, DEFAULT_CERTIFICATE_DESIGN } from '@cio/certificates';

  /**
   * Renders the default ClassroomIO certificate template (classique) in an iframe.
   * Used on customer-education and compliance-training pages.
   *
   * @typedef {Object} Props
   * @property {string} recipient           Person's name
   * @property {string} achievement         Course or cohort name
   * @property {string} issued              Issue date (e.g. "11 May 2026")
   * @property {string} verifyValue         Certificate ID rendered in the seal
   * @property {string} [orgName]           Org name shown on the top tag (default "ClassroomIO")
   * @property {string} [courseDescription] Body description (default derived from achievement)
   */

  /** @type {Props} */
  let {
    recipient,
    achievement,
    issued,
    verifyValue,
    orgName = 'ClassroomIO',
    courseDescription = `For successfully completing ${achievement}.`
  } = $props();

  const srcdoc = renderCertificateDocument(DEFAULT_CERTIFICATE_DESIGN, {
    recipientName: recipient,
    courseName: achievement,
    courseDescription,
    orgName,
    date: issued,
    certificateId: verifyValue
  });

  const NATIVE_W = 1100;
  const NATIVE_H = 780;

  /** @type {HTMLDivElement | null} */
  let stageEl = $state(null);
  let scale = $state(0.5);

  onMount(() => {
    if (!stageEl || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      if (rect.width > 0) scale = rect.width / NATIVE_W;
    });
    observer.observe(stageEl);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={stageEl}
  class="relative overflow-hidden rounded-2xl border border-gray-200 shadow-2xl/10"
  style="aspect-ratio: {NATIVE_W} / {NATIVE_H};"
>
  <iframe
    title="Certificate preview"
    sandbox="allow-same-origin"
    {srcdoc}
    class="absolute top-0 left-0 border-0"
    style="width: {NATIVE_W}px; height: {NATIVE_H}px; transform: scale({scale}); transform-origin: top left;"
  ></iframe>
</div>
