<script lang="ts">
  import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
  import { mode } from 'mode-watcher';

  let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
  closeButton
  theme={mode.current}
  class="toaster ui:z-999 ui:group"
  toastOptions={{
    classes: {
      toast:
        'ui:group toast ui:group-[.toaster]:bg-background ui:group-[.toaster]:text-foreground ui:group-[.toaster]:border-border ui:group-[.toaster]:shadow-lg',
      description: 'ui:group-[.toast]:text-muted-foreground',
      actionButton: 'ui:group-[.toast]:bg-primary ui:group-[.toast]:text-primary-foreground',
      cancelButton: 'ui:group-[.toast]:bg-muted ui:group-[.toast]:text-muted-foreground'
    }
  }}
  {...restProps}
/>
