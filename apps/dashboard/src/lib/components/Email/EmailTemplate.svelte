<script lang="ts">
  import { Container, Head, Html, Img, Preview, Section, Text } from 'svelte-email';

  export let children: ConstructorOfATypedSvelteComponent;
  export let props = {};

  const main = {
    background: '#fff'
  };

  const container = {
    margin: '20px auto 100px',
    padding: '0 40px',
    backgroundColor: '#fff',
    width: '80%',
    maxWidth: '600px'
  };

  const logo = {
    margin: '0 auto'
  };
</script>

<Html lang="en">
  <Head />
  <Preview preview="Welcome to ClassroomIO" />
  <Section style={main}>
    <Container style={container}>
      <Img
        src="https://app.classroomio.com/logo-512.png"
        alt="ClassroomIO logo"
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
      <svelte:component this={children} {...props} />
    </Container>
  </Section>
</Html>
