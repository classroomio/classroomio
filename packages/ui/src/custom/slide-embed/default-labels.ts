import type { SlideEmbedPickerLabels } from './types';

export const DEFAULT_SLIDE_EMBED_PICKER_LABELS: SlideEmbedPickerLabels = {
  searchPlaceholder: 'Search platforms',
  emptyPrompt: 'Pick a platform to see step-by-step instructions and paste your embed code.',
  embedCodeLabel: 'Paste embed code',
  embedCodePlaceholder: '<iframe src="https://..."></iframe>',
  addEmbed: 'Add slide',
  howToEmbed: 'How to embed',
  previewLabel: 'Preview',
  embedReady: 'Embed ready',
  invalidEmbed: 'Paste the full iframe embed code from this platform.',
  unsupportedPlatform: 'That embed is from a platform we do not support yet.',
  platforms: {
    'google-slides': {
      hint: 'File → Share → Publish to web → Embed',
      steps: [
        'Open your deck and choose File → Share → Publish to web.',
        'Switch to the Embed tab and click Publish.',
        'Copy the iframe embed code and paste it here.'
      ]
    },
    canva: {
      hint: 'Share → More → Embed',
      steps: [
        'Above the editor, click Share → More.',
        'Choose Embed and confirm (this makes the design public).',
        'Copy the HTML embed code and paste it here.'
      ]
    },
    powerpoint: {
      hint: 'PowerPoint for the web → File → Share → Embed',
      steps: [
        'Save the deck to OneDrive, then open it in PowerPoint for the web.',
        'Choose File → Share → Embed and pick your dimensions.',
        'Copy the iframe embed code and paste it here. We size the player ourselves.'
      ]
    },
    keynote: {
      hint: 'Collaborate → Copy Link, then embed',
      steps: [
        'Click Collaborate and set access to Anyone with the link · View only.',
        'Copy the iCloud link, then get the embed code for your website.',
        'Paste the iframe embed code here.'
      ]
    },
    figma: {
      hint: 'Share a Figma Slides file and copy the embed',
      steps: [
        'Open your Figma Slides file and enable link sharing.',
        'Copy the embed code for the /slides or /deck file.',
        'Paste the iframe embed code here.'
      ]
    },
    prezi: {
      hint: 'Share → Embed',
      steps: [
        'From the dashboard, open Share on your presentation.',
        'Click Embed and copy the code.',
        'Paste the iframe embed code here.'
      ]
    },
    pitch: {
      hint: 'Share externally → Copy embed code',
      steps: [
        'Click Share → Share externally and create a public link.',
        'Open the link Options (⋯) and choose Copy embed code.',
        'Paste the iframe embed code here.'
      ]
    },
    gamma: {
      hint: 'Share → enable public access → copy iframe',
      steps: [
        'Open Share and toggle Allow public access.',
        'Copy the generated iframe embed code.',
        'Paste the iframe embed code here.'
      ]
    },
    slideshare: {
      hint: 'Share → Embed under the deck',
      steps: [
        'Open the public deck on slideshare.net.',
        'Click Share under the viewer and open the Embed tab.',
        'Copy the iframe embed code and paste it here.'
      ]
    },
    beautiful: {
      hint: 'Sharing Settings → Public → Get Embed Code',
      steps: [
        'Open Sharing Settings and switch the deck to Public.',
        'Click Get Embed Code.',
        'Paste the iframe embed code here.'
      ]
    }
  }
};
