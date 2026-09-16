<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ModernGoldCertificatePreview from '@cio/plugins/components/modern-gold-preview';
  import { FIELDS } from './fields';

  const defaultArgs = {
    accentColor: '#d4af37',
    courseTitle: 'Advanced TypeScript',
    orgName: 'ClassroomIO Academy',
    recipientName: 'Ada Lovelace',
    verifiedCredentialLabel: 'Verified credential',
    certificateTitle: 'Certificate of completion',
    presentedToLabel: 'Proudly presented to',
    completionLabel: 'For completion of',
    instructorLabel: 'Instructor signature',
    templateLabel: 'Modern Gold',
    directorLabel: 'Academy director'
  };

  const { Story } = defineMeta({
    title: 'Molecules/Plugins/ModernGoldCertificate',
    component: ModernGoldCertificatePreview,
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

<Story name="Blue accent" args={{ ...defaultArgs, accentColor: '#2563eb' }} />

<Story
  name="Long content"
  args={{
    ...defaultArgs,
    courseTitle: 'Distributed Systems, Reliability Engineering, and Cloud Architecture',
    orgName: 'International Academy of Applied Technology',
    recipientName: 'Alexandria Catherine Montgomery'
  }}
/>
