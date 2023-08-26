<script lang="ts">
  import { Text, Section, Button, Link } from 'svelte-email';

  export let name = '';

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const paragraph = {
    fontFamily,
    fontSize: '16px',
    lineHeight: '26px'
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

<Text style={paragraph}>Dear {name},</Text>
<Text style={paragraph}>Welcome to the vibrant community of ClassroomIO!</Text>
<Text style={paragraph}>
  We're thrilled to have you join us in shaping the future of education. Your decision to embark on
  this journey with us is deeply appreciated, and we're genuinely excited about the possibilities
  that lie ahead.
</Text>
<Text style={paragraph}>
  At ClassroomIO, we understand the dedication and passion that educators like you bring to the
  table. That's why we've built a platform that's not only designed to make your teaching experience
  seamless but also to empower you to create transformative learning moments for your students.
</Text>
<Text style={paragraph}>
  Your choice to use ClassroomIO is a testament to your commitment to innovation in education. It's
  educators like you who drive progress and inspire change, and we're here to support you every step
  of the way.
</Text>
<Text style={paragraph}>
  Our team is working diligently behind the scenes, shipping new features and updates daily. This
  means you can expect a platform that's constantly evolving, adapting to your needs, and staying at
  the forefront of educational technology.
</Text>
<Text style={paragraph}>
  We encourage you to explore ClassroomIO's range of features, from interactive quizzes and robust
  course management tools to collaborative forums and AI-integrated lesson planning. Your feedback
  is invaluable to us as we work together to refine and enhance these features to best suit your
  teaching style and objectives.
</Text>
<Text style={paragraph}>
  Once again, welcome to the ClassroomIO family. We're here to help, to listen, and to celebrate
  your successes. Get ready to unlock a world of possibilities in education!
</Text>
<Section style={btnContainer}>
  <Button pX={12} pY={12} style={button} href="https://app.classroomio.com">Go to Dashboard</Button>
</Section>
<Text style={footerParagraph}>Best regards</Text>
<Text style={footerParagraph}>Rotimi Best</Text>
<Text style={footerParagraph}
  ><Link style={linkStyle} href="https://classroomio.com">ClassroomIO</Link></Text
>
