<script lang="ts">
  import { Text, Section, Button, Link } from 'svelte-email';

  export let name = '';
  export let orgName = '';
  export let inviteLink = '';
  export let courseName = '';

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const paragraph = {
    fontFamily,
    fontSize: '16px',
    lineHeight: '26px'
  };
  const paragraphContent = {
    ...paragraph,
    margin: '20px 0'
  };

  const footerParagraph = {
    ...paragraph,
    margin: '0px'
  };

  const btnContainer = {
    textAlign: 'center' as const
  };

  const button = {
    fontFamily,
    backgroundColor: '#1d4ee2',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block'
  };
</script>

<Text style={paragraph}>Hey {name},</Text>
<Text style={paragraphContent}>
  You have been given access to teach a course by {orgName}
</Text>
<Text style={paragraphContent}>
  The course is titled: {courseName}
</Text>

<Section style={btnContainer}>
  <Button pX={12} pY={12} style={button} href={inviteLink}>Open Dashboard</Button>
</Section>
