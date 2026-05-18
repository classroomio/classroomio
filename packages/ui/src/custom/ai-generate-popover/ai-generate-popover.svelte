<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Popover from '../../base/popover';
  import * as Select from '../../base/select';
  import { Button } from '../../base/button';
  import { Textarea } from '../../base/textarea';
  import { cn } from '../../tools';

  type Tone = 'professional' | 'casual' | 'expert' | 'friendly';

  interface Props {
    onGenerate: (prompt: string, tone: Tone) => Promise<void>;
    align?: 'start' | 'center' | 'end';
    class?: string;
  }

  let { onGenerate, align = 'end', class: className }: Props = $props();

  const TONE_STORAGE_KEY = 'ai-generate-popover-tone';

  function readStoredTone(): Tone {
    try {
      const stored = localStorage.getItem(TONE_STORAGE_KEY);
      if (stored === 'professional' || stored === 'casual' || stored === 'expert' || stored === 'friendly') {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return 'expert';
  }

  let open = $state(false);
  let prompt = $state('');
  let tone = $state<Tone>(readStoredTone());
  let loading = $state(false);

  function handleToneChange(value: string) {
    tone = value as Tone;
    try {
      localStorage.setItem(TONE_STORAGE_KEY, tone);
    } catch {
      // localStorage unavailable
    }
  }

  const toneOptions: { value: Tone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'expert', label: 'Expert' },
    { value: 'friendly', label: 'Friendly' }
  ];

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;

    loading = true;
    try {
      await onGenerate(prompt.trim(), tone);
      open = false;
      prompt = '';
    } finally {
      loading = false;
    }
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class={cn('ui:size-6 ui:text-muted-foreground ui:hover:text-primary', className)}
      aria-label="Generate content with AI"
    >
      <SparklesIcon class="ui:size-3.5" />
    </Button>
  </Popover.Trigger>

  <Popover.Content {align} sideOffset={8} class="ui:w-96 ui:p-4 ui:space-y-3" style="z-index: 251">
    <div class="ui:flex ui:items-center ui:gap-2">
      <p class="ui:text-sm ui:font-semibold">Generate Content</p>
      <InfoIcon class="ui:size-4 ui:text-muted-foreground" />
    </div>

    <div class="ui:space-y-1.5">
      <p class="ui:text-sm ui:text-muted-foreground">Describe what this text is about</p>
      <Textarea
        bind:value={prompt}
        placeholder="e.g. a headline about the benefits of learning online"
        rows={3}
        onkeydown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
        }}
      />
    </div>

    <div class="ui:flex ui:items-center ui:justify-between ui:gap-2">
      <Select.Root type="single" value={tone} onValueChange={handleToneChange}>
        <Select.Trigger size="sm" class="ui:w-auto">
          Tone: {toneOptions.find((t) => t.value === tone)?.label}
        </Select.Trigger>
        <Select.Content style="z-index: 251">
          {#each toneOptions as option (option.value)}
            <Select.Item value={option.value}>{option.label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>

      <Button type="button" variant="secondary" size="sm" disabled={!prompt.trim() || loading} onclick={handleGenerate}>
        {loading ? 'Generating…' : 'Generate'}
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
