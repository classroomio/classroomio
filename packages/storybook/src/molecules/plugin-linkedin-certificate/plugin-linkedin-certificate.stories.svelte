<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LinkedInCertificateButton from '@cio/plugins/components/linkedin-certificate-button';
  import { FIELDS } from './fields';

  const defaultArgs = {
    courseTitle: 'Advanced TypeScript',
    orgName: 'ClassroomIO Academy',
    earnedAt: '2026-09-16T12:00:00.000Z',
    certificateId: 'CERT-2026-001',
    verificationUrl: 'https://example.com/certificates/CERT-2026-001',
    disabled: false,
    label: 'Add to LinkedIn'
  };

  const { Story } = defineMeta({
    title: 'Molecules/Plugins/LinkedInCertificate',
    component: LinkedInCertificateButton,
    tags: ['autodocs'],
    args: defaultArgs,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    }
  });
</script>

<Story name="Default" />

<Story name="Disabled" args={{ ...defaultArgs, disabled: true }} />

<Story
  name="Long content"
  args={{
    ...defaultArgs,
    courseTitle: 'Distributed Systems, Reliability Engineering, and Cloud Architecture',
    orgName: 'International Academy of Applied Technology'
  }}
/>
