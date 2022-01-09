<script>
  import EditContent from '../../../EditContent/index.svelte';
  import { landingPageStore } from '../../store';
</script>

<EditContent bind:value={$landingPageStore.requirement.content} />
