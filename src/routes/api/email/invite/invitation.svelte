<script lang="ts">
  import { Text, Section, Button, Link } from 'svelte-email';

  export let orgName = '';
  export let inviteLink = '';

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

  const linkStyle = {
    color: '#1d4ee2'
  };
</script>

<Text style={paragraph}>Hey there,</Text>
<Text style={paragraphContent}>
  You have been invited to join {orgName} on ClassroomIO.
</Text>

<Section style={btnContainer}>
  <Button pX={12} pY={12} style={button} href={inviteLink}>Accept Invitation</Button>
</Section>
<Text style={footerParagraph}>Best regards</Text>
<Text style={footerParagraph}>Rotimi Best</Text>
<Text style={footerParagraph}
  ><Link style={linkStyle} href="https://classroomio.com">ClassroomIO</Link></Text
>
