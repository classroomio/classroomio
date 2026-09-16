<script lang="ts">
  interface Props {
    accentColor?: string;
    courseTitle: string;
    orgName: string;
    recipientName: string;
    verifiedCredentialLabel: string;
    certificateTitle: string;
    presentedToLabel: string;
    completionLabel: string;
    instructorLabel: string;
    templateLabel: string;
    directorLabel: string;
  }

  let {
    accentColor = '#d4af37',
    courseTitle,
    orgName,
    recipientName,
    verifiedCredentialLabel,
    certificateTitle,
    presentedToLabel,
    completionLabel,
    instructorLabel,
    templateLabel,
    directorLabel
  }: Props = $props();
</script>

<div
  class="relative aspect-[1100/780] w-full max-w-2xl overflow-hidden rounded-lg border shadow-xl"
  style="background: radial-gradient(circle at center, #131b2e 0%, #0a0f1d 100%); color: #f8fafc;"
>
  <div class="m-2 h-[calc(100%-1rem)] border-2 p-3 text-center" style="border-color: {accentColor};">
    <div
      class="flex h-full flex-col items-center justify-between border p-4"
      style="border-color: {accentColor}66; background: rgba(15, 23, 42, 0.4);"
    >
      <div class="flex w-full justify-between text-[9px] tracking-widest uppercase" style="color: {accentColor};">
        <span>{orgName}</span>
        <span>{verifiedCredentialLabel}</span>
      </div>

      <div class="my-auto flex flex-col items-center gap-1">
        <h3 class="font-serif text-xs font-bold tracking-widest text-white sm:text-sm">{certificateTitle}</h3>
        <p class="text-[8px] tracking-widest text-slate-400">{presentedToLabel}</p>
        <p class="font-serif text-sm font-semibold tracking-wide text-slate-100 sm:text-base">{recipientName}</p>
        <p class="mt-1 text-[8px] tracking-wider text-slate-400">{completionLabel}</p>
        <p class="text-xs font-semibold" style="color: {accentColor};">{courseTitle}</p>
      </div>

      <div class="flex w-full items-center justify-between text-[8px] text-slate-400">
        <span>{instructorLabel}</span>
        <span class="rounded border border-amber-500/40 px-2 py-0.5 text-[8px] text-amber-300">{templateLabel}</span>
        <span>{directorLabel}</span>
      </div>
    </div>
  </div>
</div>
