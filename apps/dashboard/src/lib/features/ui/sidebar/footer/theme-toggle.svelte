<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { MonitorIcon, SunIcon, MoonIcon } from '@lucide/svelte';
  import { userPrefersMode, resetMode, setMode } from '@cio/ui/base/dark-mode';

  type UserPrefersMode = typeof userPrefersMode.current;

  const themes: { mode: UserPrefersMode; icon: typeof MonitorIcon }[] = [
    { mode: 'light', icon: SunIcon },
    { mode: 'dark', icon: MoonIcon },
    { mode: 'system', icon: MonitorIcon }
  ];

  const handleThemeChange = (newMode: UserPrefersMode) => {
    if (newMode === 'light') {
      setMode('light');
    } else if (newMode === 'dark') {
      setMode('dark');
    } else {
      resetMode();
    }
  };

  $effect(() => {
    console.log('mode.current', userPrefersMode.current);
  });
</script>

<div class="flex items-center justify-between gap-8">
  <p>Theme</p>

  <div class="flex items-center gap-1 rounded-md backdrop-blur-sm">
    {#each themes as theme (theme.mode)}
      {@const isActive = userPrefersMode.current === theme.mode || userPrefersMode.current === undefined}
      <Button
        size="icon-sm"
        variant={isActive ? 'outline' : 'ghost'}
        class={['size-4 rounded-md p-1 transition-all duration-200', isActive && 'shadow-primary/20 shadow-lg']}
        title={theme.mode}
        onclick={() => handleThemeChange(theme.mode)}
      >
        <theme.icon class="size-4" />
      </Button>
    {/each}
  </div>
</div>
