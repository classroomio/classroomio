<a href="https://classroomio.com/">
  <img alt="Spend less time doing the boring stuffs, instead focus on impacting the lives of your students." src="https://classroomio.com/classroomio-opengraph-image.png" />
  <h1 align="center">ClassroomIO</h1>
  <p align="center">The Open Source Teaching Platform for Bootcamps</p>
</a>

## Why the name?

Initially I set out to build a customizable version of Google Classroom and I knew I wanted this to be a teaching software that can be used anywhere therefore I needed Classroom in the name just like Google Classroom. As for `IO`, I followed the Google IO conference so closely and, the wording really sounded well to me plus, IO sounded more techy which made me feel that adding it to the name would mean `A Classroom driven by technology`. This made me consider calling it `Classroom` + `IO`, however the domain for classroom.io was taken so I made the IO part of the name thereby giving birth to `ClassroomIO.com`

## Why build another LMS?

The main goal of all LMS (Learning Managment System) is to provide learning materials for online learning. There could be features like chatting which seems like collaboration. However the problem is that this format of materials are not suitable for actual classrooms, the tools are not hybrid systems rather they are one sided.

The reason why during the pandemic programmers could comfortably work remotely is because all our actual work in the office happens on a computer, NOTHING is done outside the computer - except chatting with colleagues and attending meetings (which we replaced with Zoom, Meet, Teams or Slack while working from home). This means that we can work wherever our laptops and internet can go. Classroomio is supposed to be that tool that helps give the educational system that same leverage.

I personally believe that in the future (as already exists in most countries), the same way books and writing materials (pen, pencils etc) are required by students to have when coming to class, laptops would be required and a tool that integrates deeply into and outside a classroom would be needed for this.

## Why Open Source?

Ultimately I want this project to become the Wordpress or Linux for Education. Anyone can take the software run any form of teaching or learning programs on it and it disappears. No one needs to know it was built using ClassroomIO, however it powers everything in education.

## Main Themes

1. Data driven
2. Focus and optimize for learning
3. All in one place
4. Empower hybrid form of learning
5. We Automate routine tasks and you focus on the health of your classroom.

## Installation of modules

```js
npm i --legacy-peer-deps --registry=https://registry.npmjs.org
```

Note: Make sure you are using Node 18

## Environment variable

```env
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_SUPABASE_URL=
OPENAI_API_KEY=
CLOUDFLARE_TOKEN_VALUE=
CLOUDFLARE_ACCESS_KEY=
CLOUDFLARE_SECRET_ACCESS_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_PUBLIC_ACCOUNT_ID=
MUSE_API_KEY=
VITE_SENTRY_AUTH_TOKEN=
```
