<script lang="ts">
  import { ModeWatcher } from '@cio/ui/base/dark-mode';
</script>

<!-- theme-init.js (loaded from app.html) handles the pre-paint seed + FOUC. Skip
     mode-watcher's own head-script injection: it is inline and blocked by our CSP. -->
<ModeWatcher defaultMode="light" disableHeadScriptInjection={true} />
