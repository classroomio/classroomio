<script lang="ts">
  import { logout } from '$lib/utils/functions/logout';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
</script>

<PrimaryButton variant={VARIANTS.OUTLINED} label="Log out" onClick={logout} />
