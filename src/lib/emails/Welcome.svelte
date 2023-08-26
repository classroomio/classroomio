<script lang="ts">
  import { Container, Head, Hr, Html, Img, Preview, Section, Text } from 'svelte-email';

  export let firstName = 'Seun';

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';

  const main = {
    background: `radial-gradient(
      circle at 10% 20%,
      rgb(239, 246, 249) 0%,
      rgb(206, 239, 253) 90%
    )`
  };

  const container = {
    margin: '100px auto',
    padding: '40px',
    backgroundColor: '#fff',
    border: '1px solid #cccccc',
    borderRadius: '10px'
  };

  const logo = {
    margin: '0 auto'
  };

  const paragraph = {
    fontFamily,
    fontSize: '16px',
    lineHeight: '26px'
  };

  const footerParagraph = {
    ...paragraph,
    margin: '0px'
  };

  const footer = {
    fontFamily,
    color: '#8898aa',
    fontSize: '12px'
  };
</script>

<Html lang="en">
  <Head />
  <Preview preview="Welcome to ClassroomIO" />
  <Section style={main}>
    <Container style={container}>
      <Img
        src="https://app.classroomio.com/logo-512.png"
        alt="Svelte logo"
        style={logo}
        width="50"
        height="50"
      />
      <Text
        style={{
          textAlign: 'center',
          color: '#1d4ee2',
          fontWeight: 'bold',
          fontSize: '20px'
        }}>ClassroomIO</Text
      >
      <Text style={paragraph}>Dear {firstName},</Text>
      <Text style={paragraph}>Welcome to the vibrant community of ClassroomIO!</Text>
      <Text style={paragraph}>
        We're thrilled to have you join us in shaping the future of education. Your decision to
        embark on this journey with us is deeply appreciated, and we're genuinely excited about the
        possibilities that lie ahead.
      </Text>
      <Text style={paragraph}>
        At ClassroomIO, we understand the dedication and passion that educators like you bring to
        the table. That's why we've built a platform that's not only designed to make your teaching
        experience seamless but also to empower you to create transformative learning moments for
        your students.
      </Text>
      <Text style={paragraph}>
        Your choice to use ClassroomIO is a testament to your commitment to innovation in education.
        It's educators like you who drive progress and inspire change, and we're here to support you
        every step of the way.
      </Text>
      <Text style={paragraph}>
        Our team is working diligently behind the scenes, shipping new features and updates daily.
        This means you can expect a platform that's constantly evolving, adapting to your needs, and
        staying at the forefront of educational technology.
      </Text>
      <Text style={paragraph}>
        We encourage you to explore ClassroomIO's range of features, from interactive quizzes and
        robust course management tools to collaborative forums and AI-integrated lesson planning.
        Your feedback is invaluable to us as we work together to refine and enhance these features
        to best suit your teaching style and objectives.
      </Text>
      <Text style={paragraph}>
        Once again, welcome to the ClassroomIO family. We're here to help, to listen, and to
        celebrate your successes. Get ready to unlock a world of possibilities in education!
      </Text>
      <Text style={footerParagraph}>Best regards</Text>
      <Text style={footerParagraph}>Rotimi Best</Text>
      <Text style={footerParagraph}>ClassroomIO</Text>
    </Container>
  </Section>
</Html>
