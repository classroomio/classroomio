<script lang="ts">
  import { onMount } from 'svelte';
  import { createClassroomIOClient, type PluginContext } from '@classroomio/plugin-sdk';

  const client = createClassroomIOClient();

  let context = $state<PluginContext | null>(null);
  let noteText = $state('');
  let savedNote = $state('');
  let isSaving = $state(false);

  onMount(() => {
    async function init() {
      try {
        context = await client.context.get();
        const stored = await client.storage.get<string>('note');
        if (stored) {
          savedNote = stored;
          noteText = stored;
        }
      } catch (err) {
        console.error('[StarterPlugin] Init error:', err);
      }
    }

    void init();
  });

  async function handleSave() {
    isSaving = true;
    try {
      await client.storage.set('note', noteText);
      savedNote = noteText;
      await client.ui.toast({
        message: 'Note saved successfully to plugin storage',
        variant: 'success'
      });
    } catch (err) {
      console.error('[StarterPlugin] Save error:', err);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="mx-auto max-w-xl space-y-4 p-6">
  <div class="cio-card">
    <h2 class="mb-2 text-lg font-bold">ClassroomIO Starter Plugin</h2>
    <p class="cio-text-muted mb-4 text-sm">
      This standalone example runs in a sandboxed frame and communicates with ClassroomIO through the public
      <code>@classroomio/plugin-sdk</code> bridge.
    </p>

    {#if context}
      <div class="mb-4 rounded bg-slate-100 p-3 font-mono text-xs dark:bg-slate-800">
        <div><strong>Plugin ID:</strong> {context.pluginId}</div>
        <div><strong>Organization:</strong> {context.organizationId ?? 'N/A'}</div>
      </div>
    {/if}

    <div class="space-y-3">
      <label class="cio-label" for="starter-note">Scoped Persistent Note</label>
      <input
        id="starter-note"
        type="text"
        class="cio-input"
        placeholder="Type a note to persist..."
        bind:value={noteText}
      />

      <button
        type="button"
        class="cio-btn cio-btn-primary"
        disabled={isSaving || !noteText.trim()}
        onclick={handleSave}
      >
        {isSaving ? 'Saving...' : 'Save Note'}
      </button>

      {#if savedNote}
        <div class="cio-text-muted mt-4 text-xs">
          Current saved value: <span class="font-semibold text-slate-800 dark:text-slate-200">{savedNote}</span>
        </div>
      {/if}
    </div>
  </div>
</div>
