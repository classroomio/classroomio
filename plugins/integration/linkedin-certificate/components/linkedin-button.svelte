<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { buildLinkedInCertificationUrl } from '../utils/linkedin-url';

  interface Props {
    courseTitle?: string;
    orgName?: string;
    earnedAt?: string | Date | null;
    certificateId?: string | null;
    verificationUrl?: string | null;
    disabled?: boolean;
    label: string;
    class?: string;
  }

  let {
    courseTitle = '',
    orgName = '',
    earnedAt = null,
    certificateId = null,
    verificationUrl = null,
    disabled = false,
    label,
    class: className = ''
  }: Props = $props();

  const url = $derived(
    buildLinkedInCertificationUrl({
      courseTitle,
      orgName,
      earnedAt,
      certificateId,
      verificationUrl: verificationUrl || (typeof window !== 'undefined' ? window.location.href : undefined)
    })
  );
</script>

<Button
  variant="outline"
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  {disabled}
  class="border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10 dark:border-[#0A66C2]/50 dark:text-[#70B5F9] dark:hover:bg-[#0A66C2]/20 {className}"
>
  <svg class="size-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z"
    />
  </svg>
  <span>{label}</span>
</Button>
