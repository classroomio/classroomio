![svelte-email-banner](https://user-images.githubusercontent.com/59960385/216772883-6cc40ff9-ef6e-4269-bed3-17c1023bbaf6.png)

<div align="center"><strong>Svelte Email</strong></div>
<div align="center">Designing emails has never been easier.</div>
<br />
<div align="center">
<a href="https://svelte-email.vercel.app/">Documentation</a> 
<span> · </span>
<a href="https://github.com/carstenlebek/svelte-email">GitHub</a> 
</div>

# Introduction

After seeing [react-email](https://github.com/resendlabs/react-email) I have decided to create a similar library for Svelte. `svelte-email` enables you to write and design email templates with svelte and render them to HTML or plain text.

# Installation

Install the package to your existing SvelteKit project:

```bash title="npm"
npm install svelte-email
```

```bash title="pnpm"
pnpm install svelte-email
```

# Getting started

## 1. Create an email using Svelte

`src/$lib/emails/Hello.svelte`

```html
<script>
	import { Button, Hr, Html, Text } from 'svelte-email';

	export let name = 'World';
</script>

<Html lang="en">
	<Text>
		Hello, {name}!
	</Text>
	<Hr />
	<Button href="https://svelte.dev">Visit Svelte</Button>
</Html>
```

## 2. Send email

This example uses [Nodemailer](https://nodemailer.com/about/) to send the email. You can use any other email service provider.

`src/routes/emails/hello/+server.js`

```js
import { render } from 'svelte-email';
import Hello from '$lib/emails/Hello.svelte';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	host: 'smtp.ethereal.email',
	port: 587,
	secure: false,
	auth: {
		user: 'my_user',
		pass: 'my_password'
	}
});

const emailHtml = render({
	component: Hello,
	props: {
		name: 'Svelte'
	}
});

const options = {
	from: 'you@example.com',
	to: 'user@gmail.com',
	subject: 'hello world',
	html: emailHtml
};

transporter.sendMail(options);
```

# Documentation

For more information, please visit the [documentation](https://svelte-email.vercel.app/).

# Components

A set of standard components to help you build amazing emails without having to deal with the mess of creating table-based layouts and maintaining archaic markup.

- [HTML](https://svelte-email.vercel.app/docs/components/HTML)
- [Head](https://svelte-email.vercel.app/docs/components/head)
- [Heading](https://svelte-email.vercel.app/docs/components/heading)
- [Button](https://svelte-email.vercel.app/docs/components/button)
- [Link](https://svelte-email.vercel.app/docs/components/link)
- [Image](https://svelte-email.vercel.app/docs/components/image)
- [Divider](https://svelte-email.vercel.app/docs/components/hr)
- [Paragraph](https://svelte-email.vercel.app/docs/components/paragraph)
- [Container](https://svelte-email.vercel.app/docs/components/container)
- [Preview](https://svelte-email.vercel.app/docs/components/preview)
- [Body](https://svelte-email.vercel.app/docs/components/body)
- [Column](https://svelte-email.vercel.app/docs/components/column)
- [Section](https://svelte-email.vercel.app/docs/components/section)

# Integrations

Emails built with React Email can be converted into HTML and sent using any email service provider. Here are some examples:

- [Nodemailer](https://github.com/resendlabs/react-email/tree/main/examples/nodemailer)
- [SendGrid](https://github.com/resendlabs/react-email/tree/main/examples/sendgrid)
- [Postmark](https://github.com/resendlabs/react-email/tree/main/examples/postmark)
- [AWS SES](https://github.com/resendlabs/react-email/tree/main/examples/aws-ses)

## Author

- Carsten Lebek ([@carstenlebek](https://twitter.com/carstenlebek1))

### Authors of the original project [react-email](https://github.com/resendlabs/react-email)

- Bu Kinoshita ([@bukinoshita](https://twitter.com/bukinoshita))
- Zeno Rocha ([@zenorocha](https://twitter.com/zenorocha))
