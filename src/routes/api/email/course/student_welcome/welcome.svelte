<script lang="ts">
  import { Text } from 'svelte-email';

  export let orgName = '';
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
</script>

<Text style={paragraph}>Hey there,</Text>
<Text style={paragraphContent}>
  Congratulations, you’ve successfully joined “{courseName}"
</Text>
<Text style={paragraphContent}>
  Everything has been set up for you to have an amazing learning experience.
</Text>
<Text style={paragraphContent}>
  If you run into any issues, don’t fail to reach out to your instructor(s).
</Text>
<Text style={footerParagraph}>Cheers,</Text>
<Text style={footerParagraph}>{orgName}</Text>
