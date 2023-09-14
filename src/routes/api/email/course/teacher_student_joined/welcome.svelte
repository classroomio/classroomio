<script lang="ts">
  import { Text, Link } from 'svelte-email';

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

  const linkStyle = {
    color: '#1d4ee2'
  };
</script>

<Text style={paragraph}>Hi amazing tutor,</Text>
<Text style={paragraphContent}>
  Congratulations, a new student has joined a course you are teaching: “{courseName}""
</Text>
<Text style={paragraphContent}>
  We hope they have a great experience learning from the best (YOU).
</Text>
<Text style={paragraphContent}>
  If you run into any issues, please don’t fail to reach out to us, we’d love to make your teaching
  experience as easy as possible.
</Text>

<Text style={footerParagraph}>Cheers</Text>
<Text style={footerParagraph}>
  <Link style={linkStyle} href="https://classroomio.com">ClassroomIO</Link>
</Text>
