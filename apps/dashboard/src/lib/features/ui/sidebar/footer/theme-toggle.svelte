<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { MonitorIcon, SunIcon, MoonIcon } from '@lucide/svelte';
  import { userPrefersMode, setMode } from '@cio/ui/base/dark-mode';

  type ThemeMode = 'light' | 'dark' | 'system';

  const themes: { mode: ThemeMode; icon: typeof MonitorIcon }[] = [
    { mode: 'light', icon: SunIcon },
    { mode: 'dark', icon: MoonIcon },
    { mode: 'system', icon: MonitorIcon }
  ];

  const activeMode = $derived(userPrefersMode.current ?? 'system');

  const handleThemeChange = (newMode: ThemeMode) => {
    if (newMode === 'light') {
      setMode('light');
      return;
    }

    if (newMode === 'dark') {
      setMode('dark');
      return;
    }

    setMode('system');
  };
</script>

<div class="flex items-center justify-between gap-8">
  <p>Theme</p>

  <div class="flex items-center gap-1 rounded-md backdrop-blur-sm">
    {#each themes as theme (theme.mode)}
      <Button
        size="icon-sm"
        variant={activeMode === theme.mode ? 'outline' : 'ghost'}
        class={[
          'size-4 rounded-md p-1 transition-all duration-200',
          activeMode === theme.mode && 'shadow-primary/20 shadow-lg'
        ]}
        title={theme.mode}
        onclick={() => handleThemeChange(theme.mode)}
      >
        <theme.icon class="size-4" />
      </Button>
    {/each}
  </div>
</div>
