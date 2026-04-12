<script lang="ts">
  import { TagsAdminPage } from '$features/tag/pages';

  let { data } = $props();
</script>

<TagsAdminPage initialTagGroups={data.initialTagGroups} orgSlug={data.orgSlug} />
