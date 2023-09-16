<script lang="ts">
  import { Text, Link } from 'svelte-email';

  export let courseName = '';
  export let studentFullname = '';
  export let studentEmail = '';

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

  const linkStyle = {
    color: '#1d4ee2'
  };
</script>

<Text style={paragraph}>Hi amazing tutor,</Text>
<Text style={paragraphContent}>
  A new student has requested to join a course you are teaching: “{courseName}"
</Text>
<Text style={paragraphContent}>Student details</Text>
<Text style={paragraphContent}>
  Name: {studentFullname}<br />
  Email: {studentEmail}
</Text>

<Text style={footerParagraph}>Cheers</Text>
<Text style={footerParagraph}>
  <Link style={linkStyle} href="https://classroomio.com">ClassroomIO</Link>
</Text>
