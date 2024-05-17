<script>
  import Download from 'carbon-icons-svelte/lib/Download.svelte';

  import { PUBLIC_SERVER_URL } from '$env/static/public';
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Box from '$lib/components/Box/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = false;

  const downLoadCertificate = async () => {
    isLoading = true;
    const response = await fetch(PUBLIC_SERVER_URL + '/downloadCertificate', {
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

    let a = document.createElement('a');
    document.body.append(a);
    a.download = 'Certificate of Completion - ' + $currentOrg.name;
    a.href = fileURL;
    a.click();
    a.remove();

    isLoading = false;
  };
</script>

<Box>
  <div class="flex flex-col items-center justify-center w-max h-full gap-5">
    <img src="/images/student-certificate-preview.png" alt="Certificate" class="max-w-[218px]" />
    <p class="text-xl font-normal text-center">
      {$t('course.navItem.certificates.unlocked_certificate')}
    </p>
    <p class="text-sm font-normal text-center max-w-md">
      {$t('course.navItem.certificates.unlocked_certificate_subtitle')}
    </p>
    <PrimaryButton
      className="flex items-center gap-2"
      onClick={downLoadCertificate}
      variant={VARIANTS.CONTAINED_DARK}
      isDisabled={!PUBLIC_SERVER_URL}
      {isLoading}
    >
      <Download size={16} />
      {$t('course.navItem.certificates.download_certificate')}
    </PrimaryButton>
  </div>
</Box>
