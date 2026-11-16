<script lang="ts">
  import { SkillsAdminPage } from '$features/skills/pages';

  let { data } = $props();
</script>

<SkillsAdminPage initialSkills={data.initialSkills} />
