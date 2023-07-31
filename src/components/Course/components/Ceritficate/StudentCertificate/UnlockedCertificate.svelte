<script>
  import { course } from '../../../store';
  import { currentOrg } from '../../../../../utils/store/org';
  import { profile } from '../../../../../utils/store/user';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';

  let isLoading = false;

  const downLoadCertificate = async () => {
    isLoading = true;
    const response = await fetch(
      'https://classroomio-server.fly.dev/downloadCertificate',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: `${$course.certificate_theme}`,
          studentName: `${$profile.fullname}`,
          courseName: `${$course.title}`,
          courseDescription: `${$course.description}`,
          orgLogoUrl: `${$currentOrg.avatar_url}`,
          orgName: `${$currentOrg.name}`,
        }),
      }
    );
    const data = await response.blob();
    const file = new Blob([data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    isLoading = false;
    window.open(fileURL);
  };
</script>

<section class="studentContainer flex items-center justify-center w-full">
  <div class="flex flex-col items-center justify-center w-max h-full gap-5">
    <img src={`./${$course.certificate_theme}.svg`} alt="Certificate" />
    <p class="text-xl font-normal text-center">Certificate is now available</p>
    <PrimaryButton
      label="DownLoad Certificate"
      className="rounded-md"
      onClick={downLoadCertificate}
      {isLoading}
    />
  </div>
</section>

<style>
  .studentContainer {
    height: 80vh;
  }
</style>
