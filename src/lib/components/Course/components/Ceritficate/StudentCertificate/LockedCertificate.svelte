<script>
  import { course } from '$lib/components/Course/store';
</script>

<section class="studentContainer flex items-center justify-center w-full">
  <div class="flex flex-col items-center justify-center w-max h-full gap-2">
    <img src={`./${$course.certificate_theme}.svg`} alt="Certificate" />
    <p class="text-xl font-normal text-center">Certificates not available</p>
    <p class="text-sm font-normal text-center">
      Your instructor needs to unlock your certificate. <br /> If you need your certificate,
      please contact your instructor.
    </p>
  </div>
</section>

<style>
  .studentContainer {
    height: 80vh;
  }
</style>
