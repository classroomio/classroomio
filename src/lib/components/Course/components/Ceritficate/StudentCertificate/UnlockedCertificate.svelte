<script>
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Box from '$lib/components/Box/index.svelte';

  let isLoading = false;

  const downLoadCertificate = async () => {
    isLoading = true;
    const response = await fetch('https://classroomio-server.fly.dev/downloadCertificate', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        theme: `${$course.certificate_theme}`,
        studentName: `${$profile.fullname}`,
        courseName: `${$course.title}`,
        courseDescription: `${$course.description}`,
        orgLogoUrl: `${$currentOrg.avatar_url}`,
        orgName: `${$currentOrg.name}`
      })
    });
    const data = await response.blob();
    console.log(data);
    const file = new Blob([data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    isLoading = false;
    window.open(fileURL);
  };
</script>

<Box>
  <div class="flex flex-col items-center justify-center w-max h-full gap-5">
    <img src="/professional.svg" alt="Certificate" />
    <p class="text-xl font-normal text-center">Certificate is now available</p>
    <PrimaryButton
      label="DownLoad Certificate"
      className="rounded-md"
      onClick={downLoadCertificate}
      {isLoading}
    />
  </div>
</Box>
