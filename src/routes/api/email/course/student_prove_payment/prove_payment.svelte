<script lang="ts">
  import { Text } from 'svelte-email';

  export let courseName = '';
  export let studentFullname = '';
  export let teacherEmail = '';
  export let orgName = '';

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
</script>

<Text style={paragraph}>Hi {studentFullname},</Text>
<Text style={paragraphContent}>
  You are one step closer to joining: {courseName}
</Text>
<Text style={paragraphContent}>
  Please send your proof of payment to: {teacherEmail}, in order to join the course.
</Text>

<Text style={footerParagraph}>Talk to you soon and see you in class.</Text>
<Text style={footerParagraph}>{orgName}</Text>
