<script lang="ts">
</script>

<a
  href={coursesPath}
  title="{$t('navigation.goto')} {isCoursePage
    ? $t('navigation.courses')
    : isPathwayPage
      ? $t('navigation.pathways')
      : $t('navigation.classroomio_home')}"
  id="logo"
  class="line-clamp-1 text-lg"
>
  {title}
</a>
