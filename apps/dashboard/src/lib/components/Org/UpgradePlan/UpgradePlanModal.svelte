<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import UpgradePlanCard from './UpgradePlanCard.svelte';
  import { isUpgradeModalOpen } from './store';
</script>

<Modal
  onClose={() => ($isUpgradeModalOpen = false)}
  bind:open={$isUpgradeModalOpen}
  width="w-4/5"
  maxWidth="max-w-full"
  containerClass="!max-h-full h-[90%]"
  modalHeading="Upgrade Plan"
>
  <div>
    <UpgradePlanCard />
  </div>
</Modal>
