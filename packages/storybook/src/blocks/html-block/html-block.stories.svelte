<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import Gamepad2Icon from '@lucide/svelte/icons/gamepad-2';
  import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
  import PresentationIcon from '@lucide/svelte/icons/presentation';
  import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
  import { HtmlBlock, HtmlBlockSourceDialog } from '@cio/ui/custom/block';
  import type { HtmlBlockLabels, HtmlSourceDialogLabels, HtmlTemplate } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const LABELS: HtmlBlockLabels = {
    frameTitle: 'Embedded HTML page',
    interact: 'Interact',
    fullScreen: 'Full screen',
    more: 'More actions',
    change: 'Replace HTML',
    download: 'Download HTML',
    resizeWidth: 'Drag to resize the width',
    resizeHeight: 'Drag to resize the height',
    editWithAi: 'Edit with AI',
    aiPlaceholder: 'Describe what to change',
    aiSubmit: 'Apply',
    generating: 'Generating your page…'
  };

  const DIALOG_LABELS: HtmlSourceDialogLabels = {
    title: 'Add HTML',
    addTab: 'Add',
    codeTab: 'Paste code',
    upload: 'Upload HTML file',
    uploadHint: 'Or drag and drop here',
    createWithAi: 'Create with AI',
    describePlaceholder: 'Or describe your idea...',
    beta: 'Beta',
    generate: 'Generate',
    generating: 'Generating your page…',
    removeTemplate: 'Remove template',
    codePlaceholder: '<!doctype html>',
    insert: 'Insert'
  };

  const TEMPLATES: HtmlTemplate[] = [
    { id: 'slides', label: 'Slides', prompt: 'Create a slide deck.', tone: 'orange', icon: PresentationIcon },
    { id: 'dashboard', label: 'Dashboard', prompt: 'Create a dashboard.', tone: 'pink', icon: LayoutDashboardIcon },
    { id: 'report', label: 'Report', prompt: 'Create a report.', tone: 'red', icon: FileTextIcon },
    { id: 'explainer', label: 'Explainer', prompt: 'Create an explainer.', tone: 'yellow', icon: LightbulbIcon },
    { id: 'prototype', label: 'Prototype', prompt: 'Create a prototype.', tone: 'blue', icon: SmartphoneIcon },
    { id: 'game', label: 'Game', prompt: 'Create a game.', tone: 'green', icon: Gamepad2Icon }
  ];

  const HTML = `<!doctype html><html><head><style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f5f6fb; color: #1d2433; }
    .card { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 2px rgb(0 0 0 / 0.06); }
    button { background: #2346d8; color: white; border: 0; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
  </style></head><body>
    <h1>Live learner analytics</h1>
    <p>Click the button once you choose Interact.</p>
    <div class="card"><strong id="count">0</strong> clicks <button onclick="count.textContent = Number(count.textContent) + 1">Add one</button></div>
    ${Array.from({ length: 12 }, (_, index) => `<div class="card">Sample row ${index + 1}</div>`).join('')}
  </body></html>`;

  const { Story } = defineMeta({
    title: 'Blocks/HtmlBlock',
    component: HtmlBlock,
    tags: ['autodocs'],
    args: {
      html: HTML,
      name: 'analytics-prototype.html',
      width: 100,
      height: 420,
      editable: false,
      generating: false,
      labels: LABELS
    },
    argTypes: {
      onResize: { control: false },
      onChange: { control: false },
      onEditWithAi: { control: false }
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    }
  });
</script>

<script lang="ts">
  let editableSize = $state({ width: 80, height: 420 });
  let dialogOpen = $state(true);
</script>

<Story name="Read only" />

<Story name="Editable">
  {#snippet template(args)}
    <HtmlBlock
      {...args}
      width={editableSize.width}
      height={editableSize.height}
      editable
      onResize={(size) => (editableSize = size)}
      onChange={() => {}}
      onEditWithAi={async () => true}
    />
  {/snippet}
</Story>

<Story name="Generating" args={{ editable: true, generating: true }}>
  {#snippet template(args)}
    <HtmlBlock {...args} onEditWithAi={async () => true} />
  {/snippet}
</Story>

<Story name="Narrow" args={{ width: 50, height: 300 }} />

<Story name="Source dialog">
  {#snippet template()}
    <HtmlBlockSourceDialog
      bind:open={dialogOpen}
      templates={TEMPLATES}
      labels={DIALOG_LABELS}
      onFile={() => {}}
      onGenerate={() => {}}
      onCode={() => {}}
    />
  {/snippet}
</Story>

<Story name="Source dialog generating">
  {#snippet template()}
    <HtmlBlockSourceDialog
      open
      generating
      templates={TEMPLATES}
      labels={DIALOG_LABELS}
      onFile={() => {}}
      onGenerate={() => {}}
      onCode={() => {}}
    />
  {/snippet}
</Story>
