<script lang="ts">
  import { PathWorkspaceSidebar } from '$features/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { getSetupSteps, getSetupProgress } from '$features/learning-path/utils/setup-steps';
  import { Button } from '@cio/ui/base/button';
  import MenuIcon from '@lucide/svelte/icons/menu';
  import XIcon from '@lucide/svelte/icons/x';
  import CheckSquareIcon from '@lucide/svelte/icons/check-square';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import { t } from '$lib/utils/functions/translations';

  let { data, children } = $props();

  let mobileMenuOpen = $state(false);

  $effect(() => {
    if (data.path) {
      learningPathApi.getPath(data.path.id);
    }
  });

  const activePath = $derived(learningPathApi.currentPath || data.path);
  const basePath = $derived(`/org/${data.orgSlug}/paths/${activePath.id}`);
  const listHref = $derived(`/org/${data.orgSlug}/paths`);

  const steps = $derived(getSetupSteps(activePath, basePath));
  const progress = $derived(getSetupProgress(steps));
  const isSetupComplete = $derived(progress.percent === 100);
</script>

<svelte:head>
  <title>{activePath.name} - ClassroomIO</title>
</svelte:head>

<div class="bg-background text-foreground flex h-screen w-full overflow-hidden">
  <!-- Desktop Sidebar -->
  <div class="hidden md:flex">
    <PathWorkspaceSidebar path={activePath} orgSlug={data.orgSlug} />
  </div>

  <!-- Mobile Drawer Backdrop & Panel -->
  {#if mobileMenuOpen}
    <div class="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onclick={() => (mobileMenuOpen = false)}
        aria-hidden="true"
      ></div>

      <div class="bg-sidebar relative flex w-64 max-w-[80vw] flex-1 flex-col shadow-xl">
        <button
          type="button"
          class="text-sidebar-foreground/70 hover:text-sidebar-foreground absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-md"
          onclick={() => (mobileMenuOpen = false)}
          aria-label="Close sidebar"
        >
          <XIcon class="size-4.5" />
        </button>

        <PathWorkspaceSidebar path={activePath} orgSlug={data.orgSlug} />
      </div>
    </div>
  {/if}

  <!-- Main Area -->
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
    <!-- Topbar -->
    <header class="border-border bg-card flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <!-- Mobile hamburger -->
        <button
          type="button"
          class="border-input text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md border md:hidden"
          onclick={() => (mobileMenuOpen = true)}
          aria-label="Open sidebar"
        >
          <MenuIcon class="size-4.5" />
        </button>

        <!-- Breadcrumbs -->
        <nav class="text-muted-foreground flex items-center gap-1.5 truncate text-xs" aria-label="Breadcrumbs">
          <a href={listHref} class="hover:text-foreground hover:underline">
            {$t('learningPath.workspace.all_paths')}
          </a>
          <span class="text-border">/</span>
          <span class="text-foreground truncate font-semibold">
            {activePath.name}
          </span>
        </nav>
      </div>

      <!-- Actions -->
      <div class="flex shrink-0 items-center gap-2.5">
        {#if !isSetupComplete}
          <Button href={`${basePath}/setup`} variant="outline" size="sm" class="h-8 text-xs font-medium">
            <CheckSquareIcon class="text-primary mr-1.5 size-3.5" />
            Finish setup · {progress.percent}%
          </Button>
        {/if}

        <Button
          href={`/path/${activePath.slug || activePath.id}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="sm"
          class="hidden h-8 text-xs font-medium sm:inline-flex"
        >
          <EyeIcon class="mr-1.5 size-3.5" />
          {$t('learningPath.workspace.preview_student')}
        </Button>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 overflow-y-auto p-4 md:p-6">
      {@render children?.()}
    </main>
  </div>
</div>
