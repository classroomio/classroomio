<a href="https://classroomio.com/">
  <img alt="A flexible, user-friendly platform for creating, managing, and delivering courses for companies and training organisations" src="https://brand.cdn.clsrio.com/og/classroomio-og.png" />
  <h1 align="center">ClassroomIO</h1>
  <p align="center">
    The Open Source Teaching Platform for Bootcamps
    <br />
    <a href="https://classroomio.com">Website</a>  |  <a href="https://dub.sh/ciodiscord">Join Discord community</a>
  </p>
</a>

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/629e2bb8994345729513c4d69ccbe3d5)](https://app.codacy.com/gh/rotimi-best/classroomio?utm_source=github.com&utm_medium=referral&utm_content=rotimi-best/classroomio&utm_campaign=Badge_Grade)

## ✨ About ClassroomIO

<img alt="ClassroomIO Courses page" src="https://brand.cdn.clsrio.com/classroomio-courses.png" />

Streamline training for everyone with ClassroomIO.com. Our all-in-one platform empowers bootcamps, educators, and businesses to manage training programs easily. With our platform, anyone can run multiple classes and cohorts all from one UI. The application is mobile-first, which means that students can access your lesson materials from any device.

### Mission: Provide Students with the best learning experience

At ClassroomIO, our mission is to provide students with the best possible learning experience. We believe in empowering educators with the tools they need to deliver high-quality education that is accessible, engaging, and effective.

### Key Features

1. **📚 Advanced Course Management:** You can create unlimited courses, create lessons, invite students, add assignments, grade their assignments, and even generate certificates.
2. **👨‍👩‍👦 Multi-Teacher Management:** You can invite other teachers into your organization and assign them individual courses.
3. **🤖 AI Integration:** We've got OpenAI integration for quick course creation where you can generate course content, lesson outlines, and even generate assignments right from your lesson notes.
4. **💬 Forum:** Students can ask questions in your dedicated community and get answers from either you or other students.
5. **🏆 Kahoot-Like Quiz:** You can create live quizzes to create more engagement in your classrooms.
6. **💻 Dedicated Student Dashboard:** Once you create an account, you get a dedicated dashboard where your students can access all their courses, assignments, and more.
7. **🔒 Fully open source:** You can self-hostable the whole stack on your servers.

### Roadmap Features

1. **Forms:** Instead of using Google Forms to collect vital information from your students, you will be able to create forms directly within the dashboard.
2. **Course Announcement:** You can make public announcements from the course dashboard to all your students.
3. **Course Templates:** You can clone a full course or share templates with other people.
4. **Analytics:** You can track data about your students across multiple courses.
5. **Run Courses on Messengers:** Students can just join a channel on slack/discord/telegram and a bot automatically sends daily lesson content to your students without you doing anything.

Please reach out to me on [twitter](https://x.com/rotimi_best) if you have any feature request.

## Built With

- [Svelekit](https://kit.svelte.dev/?ref=classroomio.com)
- [Better Auth](https://www.better-auth.com/?ref=classroomio.com)
- [TailwindCSS](https://tailwindcss.com/?ref=classroomio.com)

## Get a Demo

You can book a quick 15 min demo to see if ClassroomIO is a good fit for you

<a href="https://cal.com/classroomio/demo">
  <img src="https://cal.com/book-with-cal-dark.svg" alt="Book a Call with ClassroomIO.com">
</a>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running, please follow these simple steps.

### Prerequisites

Here is what you need to be able to run Cal.com.

- [Node.js](https://nodejs.org/) (Version: >=22.x)
- [Docker](https://docs.docker.com/engine/install/) (for local database if needed)
- [NPM](https://www.npmjs.com/)

## Development

### Setup

1. Clone the repo

   ```bash
   git clone https://github.com/rotimi-best/classroomio.git
   ```

2. Go to project folder

   ```bash
   cd classroomio
   ```

3. Setup Node If your Node version does not meet the project's requirements as instructed by the docs, "nvm" (Node Version Manager) allows using Node at the version required by the project:

   ```bash
   nvm use
   ```

   You first might need to install the specific version and then use it:

   ```bash
   nvm install && nvm use
   ```

   You can install nvm from [here](https://github.com/nvm-sh/nvm).

4. Set up your `.env` file
   - Duplicate `.env.example` to `.env`

5. Install the required dependencies

   ```bash
   npm i
   ```

6. Run (in development mode)

   ```bash
   npm run dev
   ```

## Related Repos

You can find other repos related to classroomio here:

- Help Docs: <https://github.com/rotimi-best/classroomio.com/docs>
- ClassroomIO.com: <https://github.com/rotimi-best/classroomio.com>
