<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { MonitorIcon, SunIcon, MoonIcon } from '@lucide/svelte';
  import { mode, resetMode, setMode } from 'mode-watcher';
  import { onMount } from 'svelte';

  type ThemeMode = 'system' | 'light' | 'dark';

  let currentTheme: ThemeMode = $state('system');

  onMount(() => {
    console.log('userPrefersMode', mode.current);
  });

  const themes: { mode: ThemeMode; icon: any; label: string }[] = [
    { mode: 'light', icon: SunIcon, label: 'Light' },
    { mode: 'dark', icon: MoonIcon, label: 'Dark' },
    { mode: 'system', icon: MonitorIcon, label: 'System' }
  ];

  const handleThemeChange = (mode: ThemeMode) => {
    currentTheme = mode;

    if (mode === 'system') {
      resetMode();
    } else if (mode === 'light') {
      setMode('light');
    } else if (mode === 'dark') {
      setMode('dark');
    }
  };
</script>

<div class="flex items-center justify-between gap-8">
  <p>Theme</p>

  <div class="flex items-center gap-1 rounded-md backdrop-blur-sm">
    {#each themes as theme (theme.mode)}
      <Button
        size="icon"
        variant={currentTheme === theme.mode ? 'outline' : 'ghost'}
        class={[
          'size-3 rounded-md p-2 transition-all duration-200',
          currentTheme === theme.mode && 'shadow-primary/20 shadow-lg'
        ]}
        title={theme.label}
        onclick={() => handleThemeChange(theme.mode)}
      >
        <theme.icon class="size-4" />
      </Button>
    {/each}
  </div>
</div>
